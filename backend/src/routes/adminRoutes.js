const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const {
  getStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listCourses,
} = require('../controllers/adminController');

// All admin routes require authentication + admin or superadmin role
// (superadmin bypasses the role check automatically in authorize middleware)
router.use(authenticate, authorize('admin'));

router.get('/stats',             getStats);
router.get('/users',             listUsers);
router.patch('/users/:id/role',  updateUserRole);
router.delete('/users/:id',      deleteUser);
router.get('/courses',           listCourses);

module.exports = router;
