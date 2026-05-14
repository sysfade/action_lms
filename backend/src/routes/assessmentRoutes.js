const express = require('express');
const router = express.Router();
const { 
  getLessonAssessment, 
  submitAssessment, 
  upsertAssessment 
} = require('../controllers/assessmentController');
const {
  getPendingSubmissions,
  getSubmissionDetails,
  postGrade,
  getMySubmissions
} = require('../controllers/gradingController');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

// Student & Instructor
router.get('/lessons/:lessonId/assessment', authenticate, getLessonAssessment);
router.post('/assessments/:id/submit', authenticate, upload.single('scanned_page'), submitAssessment);

// Student: view own results
router.get('/submissions/mine', authenticate, getMySubmissions);

// Instructor only (Grading)
router.get('/grading/pending', authenticate, authorize('instructor', 'admin'), getPendingSubmissions);
router.get('/submissions/:id', authenticate, authorize('instructor', 'admin'), getSubmissionDetails);
router.post('/submissions/:id/grade', authenticate, authorize('instructor', 'admin'), postGrade);

// Creator logic (Upsert - Placeholder)
router.post('/lessons/:lessonId/assessment', authenticate, authorize('instructor', 'admin'), upsertAssessment);

module.exports = router;
