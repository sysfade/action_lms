const Lesson = require('../models/lesson');
const Completion = require('../models/completion');
const db = require('../config/db');
const xpService = require('../services/xpService');

// GET /api/courses/:courseId/lessons
const getCourseLessons = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Lesson.findAllByCourse(req.params.courseId, userId);
    res.json(result.rows);
  } catch (err) {
    console.error('getCourseLessons error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/lessons/:id
const getLesson = async (req, res) => {
  try {
    const result = await Lesson.findById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const lesson = result.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // Privacy check inside the controller for standalone lesson GET
    if (userRole !== 'admin') {
      const courseResult = await db.query(
        'SELECT instructor_id FROM courses WHERE id = $1',
        [lesson.course_id]
      );
      
      const isOwner = courseResult.rows[0]?.instructor_id === userId;
      
      const enrollmentResult = await db.query(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [userId, lesson.course_id]
      );
      const isEnrolled = enrollmentResult.rows.length > 0;

      if (!isOwner && !isEnrolled) {
        return res.status(403).json({ message: 'Access denied. You must be enrolled to view this lesson.' });
      }
    }

    res.json(lesson);
  } catch (err) {
    console.error('getLesson error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/courses/:courseId/lessons
const createLesson = async (req, res) => {
  const { title, content, content_url, order_index } = req.body;
  const course_id = req.params.courseId || req.params.id;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const result = await Lesson.create({
      course_id,
      title,
      content,
      content_url,
      order_index,
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createLesson error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/lessons/:id
const updateLesson = async (req, res) => {
  const { title, content, content_url, order_index } = req.body;
  try {
    // We need the old lesson to get course_id for the ownership check if we didn't use middleware
    // But routes/lessons.js uses requireCourseOwner which handles this.
    const result = await Lesson.update(req.params.id, {
      title,
      content,
      content_url,
      order_index,
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateLesson error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/lessons/:id/toggle-completion
const toggleCompletion = async (req, res) => {
  const lessonId = req.params.id;
  const studentId = req.user.id;

  try {
    // 1. Verify existence and enrollment
    const lessonResult = await Lesson.findById(lessonId);
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const lesson = lessonResult.rows[0];

    // Check enrollment
    const enrollment = await db.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, lesson.course_id]
    );
    if (enrollment.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only enrolled students can track progress.' });
    }

    // 2. Toggle
    const existing = await Completion.findByStudentAndLesson(studentId, lessonId);
    if (existing.rows.length > 0) {
      await Completion.remove(studentId, lessonId);
      res.json({ completed: false });
    } else {
      await Completion.create(studentId, lessonId);

      // Award XP for lesson completion
      try {
        const xpAwarded = await xpService.onLessonComplete(studentId, lessonId);
        res.json({ completed: true, xpAwarded });
      } catch (xpErr) {
        console.error('XP award error (non-fatal):', xpErr);
        res.json({ completed: true, xpAwarded: null });
      }
    }
  } catch (err) {
    console.error('toggleCompletion error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    const result = await Lesson.remove(req.params.id);
    res.json({ message: 'Lesson deleted successfully' });
  } catch (err) {
    console.error('deleteLesson error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourseLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleCompletion,
};
