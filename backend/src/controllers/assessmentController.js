const Assessment = require('../models/assessment');
const Submission = require('../models/submission');
const Notification = require('../models/notification');
const db = require('../config/db');
const xpService = require('../services/xpService');

// GET /api/lessons/:lessonId/assessment
const getLessonAssessment = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const result = await Assessment.findByLesson(lessonId);
    if (result.rows.length === 0) return res.json(null);

    const assessment = result.rows[0];
    const includeAnswers = req.user.role !== 'student';
    
    assessment.questions = await Assessment.getQuestionsByAssessment(assessment.id, includeAnswers);
    
    // Check if user has already submitted
    const subResult = await Submission.findByStudentAndAssessment(req.user.id, assessment.id);
    if (subResult.rows.length > 0) {
      assessment.user_submission = subResult.rows[0];
      const answersResult = await Submission.getAnswers(assessment.user_submission.id);
      assessment.user_submission.answers = answersResult.rows;
    } else {
      assessment.user_submission = null;
    }

    res.json(assessment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/assessments/:id/submit
const submitAssessment = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const studentId = req.user.id;
    const { answers } = req.body; // Array of { questionId, selectedOptionId, textAnswer }

    const assessmentResult = await Assessment.findById(assessmentId);
    const assessment = assessmentResult.rows[0];

    // 1. Create/Get submission
    let submissionId;
    const existing = await Submission.findByStudentAndAssessment(studentId, assessmentId);
    if (existing.rows.length > 0) {
      submissionId = existing.rows[0].id;
      if (existing.rows[0].status !== 'in_progress' && !assessment.allow_multiple_attempts) {
        return res.status(400).json({ message: 'Assessment already submitted. Multiple attempts are not allowed.' });
      }
      // If allow_multiple_attempts is true, we just overwrite the existing submission's answers
      // We also reset the status to in_progress before saving new answers, but submitForGrading handles final status.
    } else {
      submissionId = await Submission.createSubmission({ assessmentId, studentId });
    }

    // 2. Process answers & Auto-grade MCQs
    const questions = await Assessment.getQuestionsByAssessment(assessmentId, true);
    let totalScore = 0;
    let hasManualGrading = false;

    if (assessment.type === 'assignment') hasManualGrading = true;

    for (const q of questions) {
      const studentAns = answers.find(a => a.questionId === q.id);
      const answerData = {
        submissionId,
        questionId: q.id,
        selectedOptionId: studentAns?.selectedOptionId,
        textAnswer: studentAns?.textAnswer,
        fileUrl: req.file ? `/uploads/${req.file.filename}` : null
      };

      if (q.type === 'written') hasManualGrading = true;

      // Auto-marking for MCQ
      if (q.type === 'mcq' && studentAns?.selectedOptionId) {
        const correctOption = q.options.find(o => o.is_correct === 1);
        if (correctOption && correctOption.id === studentAns.selectedOptionId) {
          totalScore += q.points;
        }
      }

      await Submission.saveAnswer(answerData);
    }

    // 3. Update Submission Status
    const finalStatus = hasManualGrading ? 'pending_grading' : 'graded';
    await Submission.updateGrade(submissionId, { score: totalScore, feedback: null });
    await Submission.submitForGrading(submissionId, finalStatus);

    // 4. Award XP
    let xpAwarded = null;
    try {
      if (assessment.type === 'quiz' && finalStatus === 'graded') {
        // Only award XP if the student passed
        const passingScore = assessment.passing_score || 0;
        if (totalScore >= passingScore) {
          const maxScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);
          xpAwarded = await xpService.onQuizPass(studentId, assessmentId, totalScore, maxScore);
        }
      } else if (assessment.type === 'assignment') {
        xpAwarded = await xpService.onAssignmentSubmit(studentId, assessmentId);
      }
    } catch (xpErr) {
      console.error('XP award error (non-fatal):', xpErr);
    }

    res.json({ 
      message: 'Assessment submitted successfully.', 
      status: finalStatus,
      score: totalScore,
      xpAwarded,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/lessons/:lessonId/assessment (Create/Update by Instructor)
const upsertAssessment = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, description, type, duration_minutes, deadline, passing_score, allow_multiple_attempts, questions } = req.body;

    let assessmentId;
    const existing = await Assessment.findByLesson(lessonId);
    
    if (existing.rows.length > 0) {
      assessmentId = existing.rows[0].id;
      await Assessment.update(assessmentId, { title, description, durationMinutes: duration_minutes, deadline, passingScore: passing_score, allowMultipleAttempts: allow_multiple_attempts });
    } else {
      const result = await Assessment.create({ lessonId, title, description, type, durationMinutes: duration_minutes, deadline, passingScore: passing_score, allowMultipleAttempts: allow_multiple_attempts });
      assessmentId = result.rows[0].id;
    }

    // Replace questions/options (Simple logic: clear and re-add)
    await db.query('DELETE FROM questions WHERE assessment_id = $1', [assessmentId]);
    
    if (questions && Array.isArray(questions)) {
      for (const [idx, q] of questions.entries()) {
        const qId = await Assessment.addQuestion({
          assessmentId,
          text: q.question_text,
          type: q.type,
          points: q.points || 1,
          orderIndex: idx
        });

        if (q.type === 'mcq' && q.options) {
          for (const opt of q.options) {
            await Assessment.addOption({
              questionId: qId,
              text: opt.option_text,
              isCorrect: opt.is_correct
            });
          }
        }
      }
    }

    res.json({ message: 'Assessment saved successfully', id: assessmentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLessonAssessment,
  submitAssessment,
  upsertAssessment
};
