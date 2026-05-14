const Submission = require('../models/submission');
const Assessment = require('../models/assessment');
const Notification = require('../models/notification');
const db = require('../config/db');

// GET /api/submissions/mine  (student: see own results)
const getMySubmissions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         s.id,
         s.status,
         s.total_score,
         s.instructor_feedback,
         s.submitted_at,
         a.id          AS assessment_id,
         a.title       AS assessment_title,
         a.type        AS assessment_type,
         a.passing_score,
         l.id          AS lesson_id,
         l.title       AS lesson_title,
         c.id          AS course_id,
         c.title       AS course_title
       FROM submissions s
       JOIN assessments a ON a.id = s.assessment_id
       JOIN lessons l     ON l.id = a.lesson_id
       JOIN courses c     ON c.id = l.course_id
       WHERE s.student_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/grading/pending
const getPendingSubmissions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.name as student_name, a.title as assessment_title, a.type as assessment_type
       FROM submissions s
       JOIN assessments a ON a.id = s.assessment_id
       JOIN users u ON u.id = s.student_id
       WHERE s.status = 'pending_grading'
       ORDER BY s.submitted_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/submissions/:id/details
const getSubmissionDetails = async (req, res) => {
  try {
    const subResult = await Submission.getSubmission(req.params.id);
    if (subResult.rows.length === 0) return res.status(404).json({ message: 'Submission not found' });
    
    const submission = subResult.rows[0];
    const answers = await Submission.getAnswers(submission.id);
    const assessment = await Assessment.findById(submission.assessment_id);
    const questions = await Assessment.getQuestionsByAssessment(submission.assessment_id, true);

    res.json({
      submission,
      answers: answers.rows,
      questions,
      assessment: assessment.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/submissions/:id/grade
const postGrade = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submissionId = req.params.id;

    const subResult = await Submission.getSubmission(submissionId);
    if (subResult.rows.length === 0) return res.status(404).json({ message: 'Submission not found' });
    const submission = subResult.rows[0];

    const assessmentResult = await Assessment.findById(submission.assessment_id);
    const assessment = assessmentResult.rows[0];

    await Submission.updateGrade(submissionId, { score, feedback });

    // Send notification to student
    await Notification.create({
      userId: submission.student_id,
      message: `Your results for "${assessment.title}" have been released! Grade: ${score}`,
      type: 'grade_release'
    });

    res.json({ message: 'Grading completed and student notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMySubmissions,
  getPendingSubmissions,
  getSubmissionDetails,
  postGrade
};
