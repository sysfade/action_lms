const db = require('../config/db');

/**
 * All raw SQL lives here. Controllers only call these functions.
 */

/**
 * List courses — visibility differs by role:
 *  - admin:      all courses (any status)
 *  - instructor: published + their own drafts
 *  - student:    published only + enrolled flag
 */
const findAll = async (userId, role) => {
  if (role === 'admin') {
    return db.query(
      `SELECT c.*, u.name AS instructor_name, 0 AS enrolled, 0 AS progress_percent
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       ORDER BY c.created_at DESC`
    );
  }

  if (role === 'instructor') {
    return db.query(
      `SELECT c.*, u.name AS instructor_name, 0 AS enrolled, 0 AS progress_percent
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       WHERE c.status = 'published' OR c.instructor_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
  }

  // Student — include enrollment status and progress %
  return db.query(
    `SELECT c.*, u.name AS instructor_name,
            CASE WHEN EXISTS(
              SELECT 1 FROM enrollments e
              WHERE e.student_id = $1 AND e.course_id = c.id
            ) THEN 1 ELSE 0 END AS enrolled,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons,
            (SELECT COUNT(*) 
             FROM lesson_completions lc 
             JOIN lessons l ON l.id = lc.lesson_id 
             WHERE l.course_id = c.id AND lc.student_id = $1) AS completed_lessons
     FROM courses c
     JOIN users u ON u.id = c.instructor_id
     WHERE c.status = 'published'
     ORDER BY c.created_at DESC`,
    [userId]
  );
};

const findById = async (id, studentId = null) =>
  db.query(
    `SELECT c.*, u.name AS instructor_name,
            CASE WHEN EXISTS(
              SELECT 1 FROM enrollments e
              WHERE e.student_id = $1 AND e.course_id = c.id
            ) THEN 1 ELSE 0 END AS enrolled,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons,
            (SELECT COUNT(*) 
             FROM lesson_completions lc 
             JOIN lessons l ON l.id = lc.lesson_id 
             WHERE l.course_id = c.id AND lc.student_id = $1) AS completed_lessons
     FROM courses c
     JOIN users u ON u.id = c.instructor_id
     WHERE c.id = $2`,
    [studentId, id]
  );

const create = async ({ title, description, category, status, instructorId }) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO courses (id, title, description, category, status, instructor_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, title, description || null, category || null, status || 'draft', instructorId]
  );
  return findById(id);
};

/**
 * COALESCE keeps existing value when a field is not provided in the PATCH body.
 */
const update = async (id, { title, description, category, status }) => {
  await db.query(
    `UPDATE courses
     SET title       = COALESCE($1, title),
         description = COALESCE($2, description),
         category    = COALESCE($3, category),
         status      = COALESCE($4, status),
         updated_at  = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [title || null, description || null, category || null, status || null, id]
  );
  return findById(id);
};

const remove = async (id) =>
  db.query('DELETE FROM courses WHERE id = $1', [id]);

// ── Enrollment helpers ─────────────────────────────────────────────────────

const enroll = async (studentId, courseId) => {
  const id = db.generateId();
  await db.query(
    `INSERT INTO enrollments (id, student_id, course_id)
     VALUES ($1, $2, $3)`,
    [id, studentId, courseId]
  );
  return db.query('SELECT * FROM enrollments WHERE id = $1', [id]);
};

const unenroll = async (studentId, courseId) =>
  db.query(
    'DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2',
    [studentId, courseId]
  );

const isEnrolled = async (studentId, courseId) => {
  const result = await db.query(
    'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
    [studentId, courseId]
  );
  return result.rows.length > 0;
};

const findEnrollments = async (courseId) =>
  db.query(
    `SELECT u.id, u.name, u.email, e.enrolled_at
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     WHERE e.course_id = $1
     ORDER BY e.enrolled_at DESC`,
    [courseId]
  );

/** Student → enrolled courses. Instructor → created courses. */
const findMyCourses = async (userId, role) => {
  if (role === 'student') {
    return db.query(
      `SELECT c.*, u.name AS instructor_name, e.enrolled_at,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons,
              (SELECT COUNT(*) 
               FROM lesson_completions lc 
               JOIN lessons l ON l.id = lc.lesson_id 
               WHERE l.course_id = c.id AND lc.student_id = $1) AS completed_lessons
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = c.instructor_id
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );
  }
  // instructor
  return db.query(
    `SELECT c.*, u.name AS instructor_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS total_lessons
     FROM courses c
     JOIN users u ON u.id = c.instructor_id
     WHERE c.instructor_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  enroll,
  unenroll,
  isEnrolled,
  findEnrollments,
  findMyCourses,
};
