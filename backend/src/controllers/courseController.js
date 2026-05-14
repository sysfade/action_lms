const Course = require('../models/course');

// GET /api/courses
const listCourses = async (req, res) => {
  try {
    const result = await Course.findAll(req.user.id, req.user.role);
    const courses = result.rows.map(c => ({
      ...c,
      progress_percent: c.total_lessons > 0 
        ? Math.round((c.completed_lessons / c.total_lessons) * 100) 
        : 0
    }));
    res.json(courses);
  } catch (err) {
    console.error('listCourses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/:id
const getCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Course.findById(req.params.id, userId);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const course = result.rows[0];
    const progress_percent = course.total_lessons > 0 
      ? Math.round((course.completed_lessons / course.total_lessons) * 100) 
      : 0;
    
    res.json({ ...course, progress_percent });
  } catch (err) {
    console.error('getCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  const { title, description, category, status } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const result = await Course.create({
      title,
      description,
      category,
      status,
      instructorId: req.user.id,
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/courses/:id
const updateCourse = async (req, res) => {
  const { title, description, category, status } = req.body;
  try {
    const result = await Course.update(req.params.id, {
      title,
      description,
      category,
      status,
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await Course.remove(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('deleteCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/courses/:id/enroll
const enrollCourse = async (req, res) => {
  try {
    const alreadyEnrolled = await Course.isEnrolled(req.user.id, req.params.id);
    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const result = await Course.enroll(req.user.id, req.params.id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Duplicate enrollment check (just in case)
      return res.status(400).json({ message: 'Already enrolled' });
    }
    console.error('enrollCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/courses/:id/enroll
const unenrollCourse = async (req, res) => {
  try {
    await Course.unenroll(req.user.id, req.params.id);
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    console.error('unenrollCourse error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/:id/enrollments
const listEnrollments = async (req, res) => {
  try {
    const result = await Course.findEnrollments(req.params.id);
    res.json(result.rows);
  } catch (err) {
    console.error('listEnrollments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/me
const getMyCourses = async (req, res) => {
  try {
    const result = await Course.findMyCourses(req.user.id, req.user.role);
    const courses = result.rows.map(c => ({
      ...c,
      progress_percent: c.total_lessons > 0 
        ? Math.round((c.completed_lessons / c.total_lessons) * 100) 
        : 0
    }));
    res.json(courses);
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  listEnrollments,
  getMyCourses,
};
