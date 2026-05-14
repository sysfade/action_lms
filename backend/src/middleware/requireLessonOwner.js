const db = require('../config/db');

/**
 * Verifies that the authenticated user owns the course this lesson belongs to.
 * Must be used AFTER authenticate middleware.
 */
const requireLessonOwner = async (req, res, next) => {
  const lessonId = req.params.id;

  try {
    const result = await db.query(
      `SELECT l.id, c.instructor_id 
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found.' });
    }

    // Admin bypass
    if (req.user.role === 'admin') return next();

    if (result.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own the course for this lesson.' });
    }

    next();
  } catch (err) {
    console.error('requireLessonOwner error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireLessonOwner;
