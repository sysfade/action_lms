const express = require('express');
const router = express.Router();
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  listEnrollments,
  getMyCourses,
} = require('../controllers/courseController');

const authorize = require('../middleware/authorize');
const requireCourseOwner = require('../middleware/requireCourseOwner');

// All routes in here are mounted at /api/courses and already ran through 'authenticate' in index.js

// Public (authenticated) browsing
router.get('/', listCourses);
router.get('/me', getMyCourses);
router.get('/:id', getCourse);

// Instructor/Admin only
router.post('/', authorize('instructor', 'admin'), createCourse);
router.patch('/:id', requireCourseOwner, updateCourse);
router.delete('/:id', requireCourseOwner, deleteCourse);
router.get('/:id/enrollments', requireCourseOwner, listEnrollments);

// Student only
router.post('/:id/enroll', authorize('student'), enrollCourse);
router.delete('/:id/enroll', authorize('student'), unenrollCourse);

module.exports = router;
