const db = require('../config/db');

/**
 * SQL layer for lessons.
 */

const findAllByCourse = async (courseId, studentId = null) => {
  if (!studentId) {
    return db.query(
      'SELECT *, 0 AS is_completed FROM lessons WHERE course_id = $1 ORDER BY order_index ASC, created_at ASC',
      [courseId]
    );
  }

  return db.query(
    `SELECT l.*, CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END AS is_completed
     FROM lessons l
     LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.student_id = $2
     WHERE l.course_id = $1
     ORDER BY l.order_index ASC, l.created_at ASC`,
    [courseId, studentId]
  );
};

const findById = async (id) =>
  db.query('SELECT * FROM lessons WHERE id = $1', [id]);

const create = async ({ course_id, title, content, content_url, order_index }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO lessons (id, course_id, title, content, content_url, order_index)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, course_id, title, content || null, content_url || null, order_index || 0]
  );
  return findById(id);
};

const update = async (id, { title, content, content_url, order_index }) => {
  await db.query(
    `UPDATE lessons
     SET title       = COALESCE($1, title),
         content     = COALESCE($2, content),
         content_url = COALESCE($3, content_url),
         order_index = COALESCE($4, order_index),
         updated_at  = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [title || null, content || null, content_url || null, order_index || null, id]
  );
  return findById(id);
};

const remove = async (id) =>
  db.query('DELETE FROM lessons WHERE id = $1', [id]);

module.exports = {
  findAllByCourse,
  findById,
  create,
  update,
  remove,
};
