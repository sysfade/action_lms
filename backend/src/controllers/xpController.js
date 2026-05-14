const XP = require('../models/xp');
const xpService = require('../services/xpService');

/**
 * GET /api/xp/me
 * Returns the current user's XP summary, level info, and recent history.
 */
const getMyXP = async (req, res) => {
  try {
    const userId = req.user.id;
    const [totalXP, history, rank] = await Promise.all([
      XP.getTotalXP(userId),
      XP.getXPHistory(userId),
      XP.getUserRank(userId),
    ]);

    const levelInfo = xpService.getLevelInfo(totalXP);

    res.json({
      ...levelInfo,
      rank,
      history,
    });
  } catch (err) {
    console.error('getMyXP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/xp/leaderboard
 * Returns the top students by XP with level info.
 */
const getLeaderboard = async (req, res) => {
  try {
    const entries = await XP.getLeaderboard(20);

    const leaderboard = entries.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.id,
      name: entry.name,
      totalXP: parseInt(entry.total_xp, 10),
      ...xpService.getLevelInfo(parseInt(entry.total_xp, 10)),
    }));

    // Include the current user's rank if they're not in the top 20
    let myEntry = null;
    if (req.user.role === 'student') {
      const inTop = leaderboard.find(e => e.userId === req.user.id);
      if (!inTop) {
        const [totalXP, rank] = await Promise.all([
          XP.getTotalXP(req.user.id),
          XP.getUserRank(req.user.id),
        ]);
        if (totalXP > 0) {
          myEntry = {
            rank,
            userId: req.user.id,
            name: req.user.name || 'You',
            totalXP,
            ...xpService.getLevelInfo(totalXP),
          };
        }
      }
    }

    res.json({ leaderboard, myEntry });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/xp/achievements
 * Returns the user's unlocked badges + full badge registry.
 */
const getAchievements = async (req, res) => {
  try {
    const unlocked = await XP.getAchievements(req.user.id);

    // Merge with full badge registry so the frontend can show locked ones too
    const unlockedMap = {};
    unlocked.forEach(a => { unlockedMap[a.badge_key] = a.unlocked_at; });

    const allBadges = Object.entries(xpService.BADGES).map(([key, badge]) => ({
      key,
      ...badge,
      unlocked: !!unlockedMap[key],
      unlockedAt: unlockedMap[key] || null,
    }));

    res.json({ badges: allBadges });
  } catch (err) {
    console.error('getAchievements error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMyXP, getLeaderboard, getAchievements };
