const db = require('../config/db');

// ── Student ────────────────────────────────────────────────────────────────

const getStudentDashboard = async (userId) => {
  const [enrollment, lessonStats, gradeStats, pendingResult, recentResult] = await Promise.all([
    // Enrolled course count
    db.query('SELECT COUNT(*) AS count FROM enrollments WHERE student_id = $1', [userId]),

    // Total & completed lessons across all enrolled courses
    db.query(
      `SELECT
         COALESCE(SUM(l_stats.total_lessons), 0) AS total_lessons,
         COALESCE(SUM(lc_stats.completed_lessons), 0) AS completed_lessons
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN (
         SELECT course_id, COUNT(*) AS total_lessons 
         FROM lessons 
         GROUP BY course_id
       ) l_stats ON l_stats.course_id = c.id
       LEFT JOIN (
         SELECT l.course_id, COUNT(*) AS completed_lessons
         FROM lesson_completions lc
         JOIN lessons l ON l.id = lc.lesson_id
         WHERE lc.student_id = $1
         GROUP BY l.course_id
       ) lc_stats ON lc_stats.course_id = c.id
       WHERE e.student_id = $1`,
      [userId]
    ),

    // Graded submissions stats
    db.query(
      `SELECT COUNT(*) AS graded_count,
              ROUND(AVG(total_score), 1) AS avg_score
       FROM submissions
       WHERE student_id = $1 AND status = 'graded'`,
      [userId]
    ),

    // Pending grading count
    db.query(
      `SELECT COUNT(*) AS count FROM submissions
       WHERE student_id = $1 AND status = 'pending_grading'`,
      [userId]
    ),

    // Recent 3 enrolled courses with progress
    db.query(
      `SELECT c.id, c.title, u.name AS instructor_name, e.enrolled_at,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons,
              (SELECT COUNT(*) FROM lesson_completions lc
               JOIN lessons l ON l.id = lc.lesson_id
               WHERE l.course_id = c.id AND lc.student_id = $1) AS completed_lessons
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC
       LIMIT 3`,
      [userId]
    ),
  ]);

  const gs = gradeStats.rows[0];
  return {
    enrolledCourses:  parseInt(enrollment.rows[0].count) || 0,
    totalLessons:     parseInt(lessonStats.rows[0].total_lessons) || 0,
    completedLessons: parseInt(lessonStats.rows[0].completed_lessons) || 0,
    gradedCount:      parseInt(gs.graded_count) || 0,
    avgScore:         gs.avg_score ? parseFloat(gs.avg_score) : null,
    pendingGrading:   parseInt(pendingResult.rows[0].count) || 0,
    recentCourses:    recentResult.rows,
  };
};

// ── Instructor ─────────────────────────────────────────────────────────────

const getInstructorDashboard = async (userId) => {
  const [courseStats, studentResult, pendingResult, lessonResult, recentResult] = await Promise.all([
    // Total + published courses
    db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
       FROM courses WHERE instructor_id = $1`,
      [userId]
    ),

    // Distinct students enrolled across all their courses
    db.query(
      `SELECT COUNT(DISTINCT e.student_id) AS total_students
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE c.instructor_id = $1`,
      [userId]
    ),

    // Pending submissions for their courses
    db.query(
      `SELECT COUNT(*) AS count
       FROM submissions s
       JOIN assessments a ON a.id = s.assessment_id
       JOIN lessons l ON l.id = a.lesson_id
       JOIN courses c ON c.id = l.course_id
       WHERE c.instructor_id = $1 AND s.status = 'pending_grading'`,
      [userId]
    ),

    // Total lessons across their courses
    db.query(
      `SELECT COUNT(*) AS count FROM lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE c.instructor_id = $1`,
      [userId]
    ),

    // Up to 5 most recent courses with stats
    db.query(
      `SELECT c.id, c.title, c.status, c.created_at,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lesson_count,
              (SELECT COUNT(*) FROM submissions s
               JOIN assessments a ON a.id = s.assessment_id
               JOIN lessons l ON l.id = a.lesson_id
               WHERE l.course_id = c.id AND s.status = 'pending_grading') AS pending_count
       FROM courses c
       WHERE c.instructor_id = $1
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [userId]
    ),
  ]);

  const cs = courseStats.rows[0];
  return {
    totalCourses:       parseInt(cs.total) || 0,
    publishedCourses:   parseInt(cs.published) || 0,
    totalStudents:      parseInt(studentResult.rows[0].total_students) || 0,
    pendingSubmissions: parseInt(pendingResult.rows[0].count) || 0,
    totalLessons:       parseInt(lessonResult.rows[0].count) || 0,
    recentCourses:      recentResult.rows,
  };
};

// ── Admin / Superadmin ─────────────────────────────────────────────────────

const getAdminDashboard = async () => {
  const [users, courses, enrollments, pending, recentResult] = await Promise.all([
    db.query('SELECT COUNT(*) AS count FROM users'),
    db.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END) AS draft
       FROM courses`
    ),
    db.query('SELECT COUNT(*) AS count FROM enrollments'),
    db.query("SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending_grading'"),
    db.query(
      `SELECT c.id, c.title, c.status, u.name AS instructor_name,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lesson_count
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       ORDER BY c.created_at DESC
       LIMIT 5`
    ),
  ]);

  const cr = courses.rows[0];
  return {
    totalUsers:         parseInt(users.rows[0].count) || 0,
    totalCourses:       parseInt(cr.total) || 0,
    publishedCourses:   parseInt(cr.published) || 0,
    draftCourses:       parseInt(cr.draft) || 0,
    totalEnrollments:   parseInt(enrollments.rows[0].count) || 0,
    pendingSubmissions: parseInt(pending.rows[0].count) || 0,
    recentCourses:      recentResult.rows,
  };
};

// ── Main handler ───────────────────────────────────────────────────────────

const getDashboard = async (req, res) => {
  try {
    const { id, role } = req.user;
    let data;

    if (role === 'student') {
      data = await getStudentDashboard(id);
    } else if (role === 'instructor') {
      data = await getInstructorDashboard(id);
    } else {
      // admin or superadmin
      data = await getAdminDashboard();
    }

    res.json({ role, ...data });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboard };
