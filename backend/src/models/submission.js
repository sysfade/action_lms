const db = require('../config/db');

/**
 * Handles student attempts, grading, and result tracking.
 */

const createSubmission = async ({ assessmentId, studentId }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO submissions (id, assessment_id, student_id, status)
     VALUES ($1, $2, $3, 'in_progress')`,
    [id, assessmentId, studentId]
  );
  return id;
};

const getSubmission = async (id) =>
  db.query('SELECT * FROM submissions WHERE id = $1', [id]);

const findByStudentAndAssessment = async (studentId, assessmentId) =>
  db.query('SELECT * FROM submissions WHERE student_id = $1 AND assessment_id = $2', [studentId, assessmentId]);

const saveAnswer = async ({ submissionId, questionId, selectedOptionId, textAnswer, fileUrl }) => {
  const id = db.generateId();
  // UPSERT style: delete old answer if exists for this submission/question
  await db.query('DELETE FROM answers WHERE submission_id = $1 AND question_id = $2', [submissionId, questionId]);
  
  await db.query(
    `INSERT INTO answers (id, submission_id, question_id, selected_option_id, text_answer, file_url)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, submissionId, questionId, selectedOptionId, textAnswer, fileUrl]
  );
};

const submitForGrading = async (id, status = 'pending_grading') => {
  await db.query(
    `UPDATE submissions 
     SET status = $1, submitted_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
    [status, id]
  );
};

const updateGrade = async (submissionId, { score, feedback }) => {
  await db.query(
    `UPDATE submissions 
     SET total_score = $1, instructor_feedback = $2, status = 'graded'
     WHERE id = $3`,
    [score, feedback, submissionId]
  );
};

const getAnswers = async (submissionId) =>
  db.query('SELECT * FROM answers WHERE submission_id = $1', [submissionId]);

module.exports = {
  createSubmission,
  getSubmission,
  findByStudentAndAssessment,
  saveAnswer,
  submitForGrading,
  updateGrade,
  getAnswers,
};
