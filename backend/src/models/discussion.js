const db = require('../config/db');

/**
 * Find all discussions for a specific lesson, ordered by creation time.
 */
const findByLesson = async (lessonId) => {
  const result = await db.query(
    `SELECT d.id, d.lesson_id, d.user_id, d.parent_id, d.message, d.created_at,
            u.name as user_name, u.role as user_role
     FROM discussions d
     JOIN users u ON d.user_id = u.id
     WHERE d.lesson_id = $1
     ORDER BY d.created_at ASC`,
    [lessonId]
  );
  return result.rows;
};

/**
 * Find a single discussion by ID.
 */
const findById = async (id) => {
  const result = await db.query(
    `SELECT d.id, d.lesson_id, d.user_id, d.parent_id, d.message, d.created_at,
            u.name as user_name, u.role as user_role
     FROM discussions d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0];
};

/**
 * Create a new discussion comment.
 */
const create = async ({ lessonId, userId, parentId = null, message }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO discussions (id, lesson_id, user_id, parent_id, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, lessonId, userId, parentId, message]
  );
  return id;
};

/**
 * Delete a discussion comment (and its replies via CASCADE).
 */
const remove = async (id) => {
  await db.query(`DELETE FROM discussions WHERE id = $1`, [id]);
};

module.exports = {
  findByLesson,
  findById,
  create,
  remove,
};
