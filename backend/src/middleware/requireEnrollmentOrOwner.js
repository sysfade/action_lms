const db = require('../config/db');

/**
 * Privacy guard for lesson content.
 * Allows access if:
 * 1. User is the course instructor (owner).
 * 2. User is a student enrolled in the course.
 * 3. User is an admin.
 *
 * This middleware expects :courseId to be present in params.
 */
const requireEnrollmentOrOwner = async (req, res, next) => {
  const courseId = req.params.courseId;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Admin bypass
    if (userRole === 'admin') return next();

    // 2. Check if user is the instructor (owner)
    const courseResult = await db.query(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    if (courseResult.rows[0].instructor_id === userId) {
      return next();
    }

    // 3. Check if user is an enrolled student
    const enrollmentResult = await db.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (enrollmentResult.rows.length > 0) {
      return next();
    }

    // 4. Denied
    return res.status(403).json({
      message: 'Access denied. You must be enrolled in this course to view its lessons.',
    });
  } catch (err) {
    console.error('requireEnrollmentOrOwner error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireEnrollmentOrOwner;
