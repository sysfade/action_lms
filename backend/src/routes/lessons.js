const express = require('express');
const router = express.Router();
const {
  getCourseLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleCompletion,
} = require('../controllers/lessonController');

const authorize = require('../middleware/authorize');
const authenticate = require('../middleware/authenticate');
const requireCourseOwner = require('../middleware/requireCourseOwner');
const requireLessonOwner = require('../middleware/requireLessonOwner');
const requireEnrollmentOrOwner = require('../middleware/requireEnrollmentOrOwner');

// ── Course-context routes (mounted at /api) ──────────────────────────────────

// GET /api/courses/:courseId/lessons
router.get('/courses/:courseId/lessons', authenticate, requireEnrollmentOrOwner, getCourseLessons);

// POST /api/courses/:id/lessons (reusing requireCourseOwner which uses :id)
router.post('/courses/:id/lessons', authenticate, authorize('instructor', 'admin'), requireCourseOwner, createLesson);

// Completion tracking
router.post('/lessons/:id/toggle-completion', authenticate, toggleCompletion);

// ── Standalone lesson routes ──────────────────────────────────────────────────

// GET /api/lessons/:id
router.get('/lessons/:id', getLesson); // Privacy check is handled inside controller

// PATCH /api/lessons/:id
router.patch('/lessons/:id', authorize('instructor', 'admin'), requireLessonOwner, updateLesson);

// DELETE /api/lessons/:id
router.delete('/lessons/:id', authorize('instructor', 'admin'), requireLessonOwner, deleteLesson);

module.exports = router;
