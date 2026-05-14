const db = require('../config/db');

/**
 * SQL layer for tracking student lesson progress.
 */

const findByStudentAndLesson = async (studentId, lessonId) =>
  db.query(
    'SELECT * FROM lesson_completions WHERE student_id = $1 AND lesson_id = $2',
    [studentId, lessonId]
  );

const create = async (studentId, lessonId) => {
  const id = db.generateId();
  return db.query(
    'INSERT INTO lesson_completions (id, student_id, lesson_id) VALUES ($1, $2, $3)',
    [id, studentId, lessonId]
  );
};

const remove = async (studentId, lessonId) =>
  db.query(
    'DELETE FROM lesson_completions WHERE student_id = $1 AND lesson_id = $2',
    [studentId, lessonId]
  );

/**
 * Returns a summary of completions for a specific course/student.
 */
const countCompletionsInCourse = async (studentId, courseId) => {
  const result = await db.query(
    `SELECT COUNT(lc.id) as count
     FROM lesson_completions lc
     JOIN lessons l ON l.id = lc.lesson_id
     WHERE lc.student_id = $1 AND l.course_id = $2`,
    [studentId, courseId]
  );
  return parseInt(result.rows[0].count, 10) || 0;
};

module.exports = {
  findByStudentAndLesson,
  create,
  remove,
  countCompletionsInCourse
};

