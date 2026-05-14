const db = require('../config/db');

/**
 * Verifies the authenticated user owns the course (or is admin).
 * Must be used AFTER authenticate middleware.
 * Fetches the course so downstream controllers don't need to re-query it for ownership.
 */
const requireCourseOwner = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, instructor_id FROM courses WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // Admin bypasses ownership check
    if (req.user.role === 'admin') return next();

    if (result.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this course.' });
    }

    next();
  } catch (err) {
    console.error('requireCourseOwner error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireCourseOwner;
