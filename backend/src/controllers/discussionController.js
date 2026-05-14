const Discussion = require('../models/discussion');
const Notification = require('../models/notification');
const Lesson = require('../models/lesson');
const db = require('../config/db');

/**
 * GET /api/lessons/:lessonId/discussions
 */
const getDiscussions = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const comments = await Discussion.findByLesson(lessonId);

    // Group into threads
    const topLevel = [];
    const repliesMap = {};

    comments.forEach(c => {
      if (!c.parent_id) {
        c.replies = [];
        topLevel.push(c);
        repliesMap[c.id] = c.replies;
      }
    });

    comments.forEach(c => {
      if (c.parent_id && repliesMap[c.parent_id]) {
        repliesMap[c.parent_id].push(c);
      }
    });

    res.json(topLevel);
  } catch (err) {
    console.error('getDiscussions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/lessons/:lessonId/discussions
 */
const postComment = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { message, parentId } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Verify lesson exists
    const lessonResult = await Lesson.findById(lessonId);
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    const lesson = lessonResult.rows[0];

    const commentId = await Discussion.create({
      lessonId,
      userId,
      parentId: parentId || null,
      message: message.trim()
    });

    const newComment = await Discussion.findById(commentId);

    // Handle notifications
    if (parentId) {
      // It's a reply, notify the parent author
      const parentComment = await Discussion.findById(parentId);
      if (parentComment && parentComment.user_id !== userId) {
        await Notification.create({
          userId: parentComment.user_id,
          message: `${req.user.name} replied to your comment in "${lesson.title}".`,
          type: 'discussion_reply'
        });
      }
    } else {
      // It's a top-level comment. Notify the course instructor if it's a student posting
      if (req.user.role === 'student') {
        const courseResult = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [lesson.course_id]);
        if (courseResult.rows.length > 0) {
          const instructorId = courseResult.rows[0].instructor_id;
          if (instructorId !== userId) {
            await Notification.create({
              userId: instructorId,
              message: `${req.user.name} posted a new comment in "${lesson.title}".`,
              type: 'discussion_new'
            });
          }
        }
      }
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error('postComment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/discussions/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = await Discussion.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    let canDelete = false;
    
    // User can delete their own comment
    if (comment.user_id === userId) {
      canDelete = true;
    } 
    // Superadmin and Admin can delete any comment
    else if (userRole === 'admin' || userRole === 'superadmin') {
      canDelete = true;
    } 
    // Instructor can delete if they own the course
    else if (userRole === 'instructor') {
      const lessonResult = await Lesson.findById(comment.lesson_id);
      if (lessonResult.rows.length > 0) {
        const courseId = lessonResult.rows[0].course_id;
        const courseResult = await db.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
        if (courseResult.rows.length > 0 && courseResult.rows[0].instructor_id === userId) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Discussion.remove(id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDiscussions,
  postComment,
  deleteComment,
};
