const db = require('../config/db');

/**
 * Assessment model handles CRUD for Quizzes and Assignments.
 */

const create = async ({ lessonId, title, description, type, durationMinutes, deadline, passingScore, allowMultipleAttempts }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO assessments (id, lesson_id, title, description, type, duration_minutes, deadline, passing_score, allow_multiple_attempts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, lessonId, title, description, type, durationMinutes, deadline, passingScore, allowMultipleAttempts ? 1 : 0]
  );
  return findById(id);
};

const findById = async (id) =>
  db.query('SELECT * FROM assessments WHERE id = $1', [id]);

const findByLesson = async (lessonId) =>
  db.query('SELECT * FROM assessments WHERE lesson_id = $1', [lessonId]);

const update = async (id, { title, description, durationMinutes, deadline, passingScore, allowMultipleAttempts }) => {
  await db.query(
    `UPDATE assessments
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         duration_minutes = COALESCE($3, duration_minutes),
         deadline = COALESCE($4, deadline),
         passing_score = COALESCE($5, passing_score),
         allow_multiple_attempts = COALESCE($6, allow_multiple_attempts)
     WHERE id = $7`,
    [title, description, durationMinutes, deadline, passingScore, allowMultipleAttempts !== undefined ? (allowMultipleAttempts ? 1 : 0) : null, id]
  );
  return findById(id);
};

// ── Questions & Options ────────────────────────────────────────────────────

const addQuestion = async ({ assessmentId, text, type, points, orderIndex }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO questions (id, assessment_id, question_text, type, points, order_index)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, assessmentId, text, type, points, orderIndex]
  );
  return id;
};

const addOption = async ({ questionId, text, isCorrect }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO question_options (id, question_id, option_text, is_correct)
     VALUES ($1, $2, $3, $4)`,
    [id, questionId, text, isCorrect ? 1 : 0]
  );
  return id;
};

const getQuestionsByAssessment = async (assessmentId, includeCorrectAnswers = false) => {
  const questionsResult = await db.query(
    'SELECT * FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC',
    [assessmentId]
  );
  const questions = questionsResult.rows;

  for (let q of questions) {
    const optionsResult = await db.query(
      `SELECT id, option_text ${includeCorrectAnswers ? ', is_correct' : ''} 
       FROM question_options WHERE question_id = $1`,
      [q.id]
    );
    q.options = optionsResult.rows;
  }

  return questions;
};

module.exports = {
  create,
  findById,
  findByLesson,
  update,
  addQuestion,
  addOption,
  getQuestionsByAssessment,
};
