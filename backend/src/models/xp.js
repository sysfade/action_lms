const db = require('../config/db');

/**
 * XP & Achievement data-access layer.
 */

// ── XP Events ──────────────────────────────────────────────────────────────

/**
 * Award XP to a user. Prevents duplicate awards for the same (user, action, reference).
 * Returns the new xp_event id, or null if already awarded.
 */
const awardXP = async ({ userId, action, xpAmount, referenceId }) => {
  // Duplicate guard
  if (referenceId) {
    const existing = await db.query(
      `SELECT id FROM xp_events
       WHERE user_id = $1 AND action = $2 AND reference_id = $3`,
      [userId, action, referenceId]
    );
    if (existing.rows.length > 0) return null; // Already awarded
  }

  const id = db.generateId();
  await db.query(
    `INSERT INTO xp_events (id, user_id, action, xp_amount, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, action, xpAmount, referenceId]
  );
  return id;
};

/**
 * Get total XP for a user.
 */
const getTotalXP = async (userId) => {
  const result = await db.query(
    'SELECT COALESCE(SUM(xp_amount), 0) AS total FROM xp_events WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].total, 10);
};

/**
 * Recent XP history for a user (last 20 events).
 */
const getXPHistory = async (userId) => {
  const result = await db.query(
    `SELECT id, action, xp_amount, reference_id, created_at
     FROM xp_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  );
  return result.rows;
};

/**
 * Leaderboard: top N students by total XP.
 */
const getLeaderboard = async (limit = 20) => {
  const result = await db.query(
    `SELECT u.id, u.name,
            COALESCE(SUM(x.xp_amount), 0) AS total_xp,
            COUNT(x.id) AS event_count
     FROM users u
     LEFT JOIN xp_events x ON x.user_id = u.id
     WHERE u.role = 'student'
     GROUP BY u.id
     HAVING total_xp > 0
     ORDER BY total_xp DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

/**
 * Get the rank of a specific user.
 */
const getUserRank = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*) + 1 AS rank
     FROM (
       SELECT user_id, SUM(xp_amount) AS total
       FROM xp_events
       GROUP BY user_id
     ) t
     WHERE t.total > (
       SELECT COALESCE(SUM(xp_amount), 0) FROM xp_events WHERE user_id = $1
     )`,
    [userId]
  );
  return parseInt(result.rows[0].rank, 10);
};

// ── Achievements ───────────────────────────────────────────────────────────

/**
 * Unlock a badge for a user. Silently ignores if already unlocked.
 * Returns true if newly unlocked, false if already existed.
 */
const unlockAchievement = async (userId, badgeKey) => {
  const existing = await db.query(
    'SELECT id FROM achievements WHERE user_id = $1 AND badge_key = $2',
    [userId, badgeKey]
  );
  if (existing.rows.length > 0) return false;

  const id = db.generateId();
  await db.query(
    `INSERT INTO achievements (id, user_id, badge_key)
     VALUES ($1, $2, $3)`,
    [id, userId, badgeKey]
  );
  return true;
};

/**
 * All unlocked achievements for a user.
 */
const getAchievements = async (userId) => {
  const result = await db.query(
    'SELECT badge_key, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
    [userId]
  );
  return result.rows;
};

/**
 * Count distinct lessons completed by a user.
 */
const countLessonsCompleted = async (userId) => {
  const result = await db.query(
    'SELECT COUNT(*) AS count FROM lesson_completions WHERE student_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Count distinct courses completed (all lessons done) by a user.
 */
const countCoursesCompleted = async (userId) => {
  const result = await db.query(
    `SELECT COUNT(*) AS count FROM certificates WHERE student_id = $1`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  awardXP,
  getTotalXP,
  getXPHistory,
  getLeaderboard,
  getUserRank,
  unlockAchievement,
  getAchievements,
  countLessonsCompleted,
  countCoursesCompleted,
};
