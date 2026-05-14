const XP = require('../models/xp');
const Notification = require('../models/notification');

/**
 * XP point values for each action.
 */
const XP_VALUES = {
  lesson_complete:    50,
  quiz_pass:         100,
  assignment_submit:  75,
  course_complete:   300,
};

/**
 * Level definitions — sorted ascending by threshold.
 */
const LEVELS = [
  { level: 1, title: 'Rookie',   xpRequired: 0 },
  { level: 2, title: 'Learner',  xpRequired: 200 },
  { level: 3, title: 'Scholar',  xpRequired: 500 },
  { level: 4, title: 'Achiever', xpRequired: 1000 },
  { level: 5, title: 'Expert',   xpRequired: 2000 },
  { level: 6, title: 'Master',   xpRequired: 3500 },
  { level: 7, title: 'Legend',   xpRequired: 5000 },
];

/**
 * Badge definitions (registry).
 */
const BADGES = {
  first_lesson:   { name: 'First Steps',  emoji: '👣', description: 'Complete your first lesson' },
  five_lessons:   { name: 'Dedicated',     emoji: '📖', description: 'Complete 5 lessons' },
  quiz_ace:       { name: 'Quiz Ace',      emoji: '💯', description: 'Score 100% on a quiz' },
  first_course:   { name: 'Graduate',      emoji: '🎓', description: 'Complete your first course' },
  three_courses:  { name: 'Scholar',       emoji: '🏆', description: 'Complete 3 courses' },
  xp_500:         { name: 'Rising Star',   emoji: '⭐', description: 'Reach 500 XP' },
  xp_2000:        { name: 'Powerhouse',    emoji: '🔥', description: 'Reach 2000 XP' },
};

/**
 * Compute level info from total XP.
 */
const getLevelInfo = (totalXP) => {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }

  return {
    level: current.level,
    title: current.title,
    currentXP: totalXP,
    xpForCurrentLevel: current.xpRequired,
    xpForNextLevel: next ? next.xpRequired : null,
    nextTitle: next ? next.title : null,
    progress: next
      ? Math.round(((totalXP - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100)
      : 100,
  };
};

// ── Action handlers ────────────────────────────────────────────────────────

/**
 * Called when a student marks a lesson as complete.
 */
const onLessonComplete = async (userId, lessonId) => {
  const awarded = await XP.awardXP({
    userId,
    action: 'lesson_complete',
    xpAmount: XP_VALUES.lesson_complete,
    referenceId: lessonId,
  });

  if (!awarded) return null; // Already awarded

  await Notification.create({
    userId,
    message: `🎉 +${XP_VALUES.lesson_complete} XP for completing a lesson!`,
    type: 'xp',
  });

  // Check lesson-count achievements
  const lessonCount = await XP.countLessonsCompleted(userId);
  if (lessonCount >= 1) await XP.unlockAchievement(userId, 'first_lesson');
  if (lessonCount >= 5) await XP.unlockAchievement(userId, 'five_lessons');

  // Check XP milestones
  await checkXPMilestones(userId);

  return XP_VALUES.lesson_complete;
};

/**
 * Called when a student passes a quiz (auto-graded).
 */
const onQuizPass = async (userId, assessmentId, score, maxScore) => {
  const awarded = await XP.awardXP({
    userId,
    action: 'quiz_pass',
    xpAmount: XP_VALUES.quiz_pass,
    referenceId: assessmentId,
  });

  if (!awarded) return null;

  await Notification.create({
    userId,
    message: `🎉 +${XP_VALUES.quiz_pass} XP for passing a quiz!`,
    type: 'xp',
  });

  // Perfect score badge
  if (maxScore && score >= maxScore) {
    const unlocked = await XP.unlockAchievement(userId, 'quiz_ace');
    if (unlocked) {
      await Notification.create({
        userId,
        message: `🏅 Achievement unlocked: ${BADGES.quiz_ace.emoji} ${BADGES.quiz_ace.name}!`,
        type: 'achievement',
      });
    }
  }

  await checkXPMilestones(userId);
  return XP_VALUES.quiz_pass;
};

/**
 * Called when a student submits an assignment.
 */
const onAssignmentSubmit = async (userId, assessmentId) => {
  const awarded = await XP.awardXP({
    userId,
    action: 'assignment_submit',
    xpAmount: XP_VALUES.assignment_submit,
    referenceId: assessmentId,
  });

  if (!awarded) return null;

  await Notification.create({
    userId,
    message: `🎉 +${XP_VALUES.assignment_submit} XP for submitting an assignment!`,
    type: 'xp',
  });

  await checkXPMilestones(userId);
  return XP_VALUES.assignment_submit;
};

/**
 * Called when a student completes a full course (all lessons done / certificate issued).
 */
const onCourseComplete = async (userId, courseId) => {
  const awarded = await XP.awardXP({
    userId,
    action: 'course_complete',
    xpAmount: XP_VALUES.course_complete,
    referenceId: courseId,
  });

  if (!awarded) return null;

  await Notification.create({
    userId,
    message: `🎉 +${XP_VALUES.course_complete} XP bonus for completing a course!`,
    type: 'xp',
  });

  // Course completion achievements
  const courseCount = await XP.countCoursesCompleted(userId);
  if (courseCount >= 1) {
    const unlocked = await XP.unlockAchievement(userId, 'first_course');
    if (unlocked) {
      await Notification.create({
        userId,
        message: `🏅 Achievement unlocked: ${BADGES.first_course.emoji} ${BADGES.first_course.name}!`,
        type: 'achievement',
      });
    }
  }
  if (courseCount >= 3) {
    const unlocked = await XP.unlockAchievement(userId, 'three_courses');
    if (unlocked) {
      await Notification.create({
        userId,
        message: `🏅 Achievement unlocked: ${BADGES.three_courses.emoji} ${BADGES.three_courses.name}!`,
        type: 'achievement',
      });
    }
  }

  await checkXPMilestones(userId);
  return XP_VALUES.course_complete;
};

/**
 * Check and unlock XP-based milestone badges.
 */
const checkXPMilestones = async (userId) => {
  const totalXP = await XP.getTotalXP(userId);

  if (totalXP >= 500) {
    const unlocked = await XP.unlockAchievement(userId, 'xp_500');
    if (unlocked) {
      await Notification.create({
        userId,
        message: `🏅 Achievement unlocked: ${BADGES.xp_500.emoji} ${BADGES.xp_500.name}!`,
        type: 'achievement',
      });
    }
  }

  if (totalXP >= 2000) {
    const unlocked = await XP.unlockAchievement(userId, 'xp_2000');
    if (unlocked) {
      await Notification.create({
        userId,
        message: `🏅 Achievement unlocked: ${BADGES.xp_2000.emoji} ${BADGES.xp_2000.name}!`,
        type: 'achievement',
      });
    }
  }
};

module.exports = {
  XP_VALUES,
  LEVELS,
  BADGES,
  getLevelInfo,
  onLessonComplete,
  onQuizPass,
  onAssignmentSubmit,
  onCourseComplete,
};
