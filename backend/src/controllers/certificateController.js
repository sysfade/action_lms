const db = require('../config/db');

/**
 * POST /api/certificates/:courseId
 * Issues a certificate if the student has 100% lesson completion.
 * Idempotent — returns existing certificate if already issued.
 */
const issueCertificate = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    // Check student is enrolled
    const enrollment = await db.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course.' });
    }

    // Check 100% completion
    const totalResult = await db.query(
      'SELECT COUNT(*) AS count FROM lessons WHERE course_id = $1',
      [courseId]
    );
    const doneResult = await db.query(
      `SELECT COUNT(*) AS count
       FROM lesson_completions lc
       JOIN lessons l ON l.id = lc.lesson_id
       WHERE l.course_id = $1 AND lc.student_id = $2`,
      [courseId, studentId]
    );

    const total = parseInt(totalResult.rows[0].count);
    const done  = parseInt(doneResult.rows[0].count);

    if (total === 0) {
      return res.status(400).json({ message: 'This course has no lessons.' });
    }
    if (done < total) {
      return res.status(400).json({
        message: `You have only completed ${done} of ${total} lessons. Finish all lessons to earn your certificate.`,
      });
    }

    // Check for existing certificate (idempotent)
    const existing = await db.query(
      `SELECT certs.*, c.title AS course_title, u.name AS student_name, inst.name AS instructor_name
       FROM certificates certs
       JOIN courses c ON c.id = certs.course_id
       JOIN users u ON u.id = certs.student_id
       JOIN users inst ON inst.id = c.instructor_id
       WHERE certs.student_id = $1 AND certs.course_id = $2`,
      [studentId, courseId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Issue new certificate
    const id = db.generateId();
    await db.query(
      'INSERT INTO certificates (id, student_id, course_id) VALUES ($1, $2, $3)',
      [id, studentId, courseId]
    );

    const created = await db.query(
      `SELECT certs.*, c.title AS course_title, u.name AS student_name, inst.name AS instructor_name
       FROM certificates certs
       JOIN courses c ON c.id = certs.course_id
       JOIN users u ON u.id = certs.student_id
       JOIN users inst ON inst.id = c.instructor_id
       WHERE certs.id = $1`,
      [id]
    );

    res.status(201).json(created.rows[0]);
  } catch (err) {
    console.error('issueCertificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/certificates/:courseId
 * Returns the certificate for the current student + course (if it exists).
 */
const getCertificate = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    const result = await db.query(
      `SELECT certs.*, c.title AS course_title, u.name AS student_name, inst.name AS instructor_name
       FROM certificates certs
       JOIN courses c ON c.id = certs.course_id
       JOIN users u ON u.id = certs.student_id
       JOIN users inst ON inst.id = c.instructor_id
       WHERE certs.student_id = $1 AND certs.course_id = $2`,
      [studentId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No certificate found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getCertificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/certificates
 * Returns all certificates earned by the current student.
 */
const getMyCertificates = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT certs.*, c.title AS course_title, c.category, inst.name AS instructor_name
       FROM certificates certs
       JOIN courses c ON c.id = certs.course_id
       JOIN users inst ON inst.id = c.instructor_id
       WHERE certs.student_id = $1
       ORDER BY certs.issued_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getMyCertificates error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { issueCertificate, getCertificate, getMyCertificates };
