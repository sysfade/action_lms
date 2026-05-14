const db = require('../config/db');

const MANAGEABLE_ROLES = ['student', 'instructor', 'admin', 'superadmin'];

// ── Helpers ────────────────────────────────────────────────────────────────

const isSuperAdmin = (user) => user.role === 'superadmin';

// What roles can the current actor set?
const allowedTargetRoles = (actorRole) => {
  if (actorRole === 'superadmin') return ['student', 'instructor', 'admin'];
  return ['student', 'instructor']; // admin can only toggle student ↔ instructor
};

// ── GET /api/admin/stats ───────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [users, courses, enrollments, pending, submissions] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM users'),
      db.query(`SELECT
                  COUNT(*) AS total,
                  SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
                  SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END) AS draft
                FROM courses`),
      db.query('SELECT COUNT(*) AS count FROM enrollments'),
      db.query("SELECT COUNT(*) AS count FROM submissions WHERE status = 'pending_grading'"),
      db.query('SELECT COUNT(*) AS count FROM submissions'),
    ]);

    res.json({
      totalUsers:          parseInt(users.rows[0].count),
      totalCourses:        parseInt(courses.rows[0].total),
      publishedCourses:    parseInt(courses.rows[0].published) || 0,
      draftCourses:        parseInt(courses.rows[0].draft) || 0,
      totalEnrollments:    parseInt(enrollments.rows[0].count),
      pendingSubmissions:  parseInt(pending.rows[0].count),
      totalSubmissions:    parseInt(submissions.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/admin/users ───────────────────────────────────────────────────

const listUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PATCH /api/admin/users/:id/role ───────────────────────────────────────

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const actor = req.user;

    if (!role || !MANAGEABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    // Can't change own role
    if (id === actor.id) {
      return res.status(403).json({ message: "You can't change your own role." });
    }

    // Check target user exists
    const targetResult = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const target = targetResult.rows[0];

    // superadmin is untouchable by anyone
    if (target.role === 'superadmin') {
      return res.status(403).json({ message: 'The superadmin role cannot be modified.' });
    }

    // Check actor has permission to set this role
    const permitted = allowedTargetRoles(actor.role);
    if (!permitted.includes(role)) {
      return res.status(403).json({ message: `Your role cannot promote users to '${role}'.` });
    }

    // superadmin role is only settable by... superadmin (already enforced above via permitted)
    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot promote another user to superadmin.' });
    }

    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    const updated = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/admin/users/:id ────────────────────────────────────────────

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const actor = req.user;

    // Can't delete self
    if (id === actor.id) {
      return res.status(403).json({ message: "You can't delete your own account." });
    }

    const targetResult = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const target = targetResult.rows[0];

    // No one can delete a superadmin
    if (target.role === 'superadmin') {
      return res.status(403).json({ message: 'The superadmin account cannot be deleted.' });
    }

    // Regular admin can only delete students/instructors
    if (!isSuperAdmin(actor) && !['student', 'instructor'].includes(target.role)) {
      return res.status(403).json({ message: 'Admins can only delete student or instructor accounts.' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/admin/courses ─────────────────────────────────────────────────

const listCourses = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.title, c.category, c.status, c.created_at,
              u.name AS instructor_name,
              (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lesson_count,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS enrollment_count
       FROM courses c
       JOIN users u ON u.id = c.instructor_id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listCourses,
};
