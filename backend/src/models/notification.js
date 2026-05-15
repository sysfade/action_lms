const db = require('../config/db');

/**
 * Basic notification tracking.
 */

const create = async ({ userId, message, type }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO notifications (id, user_id, message, type)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, message, type]
  );
  return id;
};

const findByUser = async (userId) =>
  db.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );

const markAsRead = async (id) =>
  db.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);

const countUnread = async (userId) => {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return result.rows[0].count;
};

const markAllRead = async (userId) =>
  db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);

const deleteOne = async (id, userId) =>
  db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);

const deleteAll = async (userId) =>
  db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

module.exports = {
  create,
  findByUser,
  markAsRead,
  markAllRead,
  countUnread,
  deleteOne,
  deleteAll,
};
