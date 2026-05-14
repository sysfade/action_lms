const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { getMyXP, getLeaderboard, getAchievements } = require('../controllers/xpController');

// All XP routes require authentication
router.use(authenticate);

router.get('/me',           getMyXP);
router.get('/leaderboard',  getLeaderboard);
router.get('/achievements', getAchievements);

module.exports = router;
