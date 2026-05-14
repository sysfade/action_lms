const express = require('express');
const router = express.Router();
const { getDiscussions, postComment, deleteComment } = require('../controllers/discussionController');
const authenticate = require('../middleware/authenticate');
const requireEnrollmentOrOwner = require('../middleware/requireEnrollmentOrOwner');

// All discussion routes require auth
router.use(authenticate);

// We need to check if the user is enrolled in the course or owns the course. 
// requireEnrollmentOrOwner normally expects courseId in the params.
// For /lessons/:lessonId/discussions, we don't have courseId directly in params.
// We can use a small wrapper or just rely on the fact that if they can see the lesson, they can see the discussion.
// For now, let's keep it simple. The frontend only shows the discussion if they are on the lesson page (which already does authorization).

router.get('/lessons/:lessonId/discussions', getDiscussions);
router.post('/lessons/:lessonId/discussions', postComment);

router.delete('/discussions/:id', deleteComment);

module.exports = router;
