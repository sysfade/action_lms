/**
 * Middleware factory: only allows requests from users with one of the given roles.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage: router.get('/admin-only', authenticate, authorize('admin'), handler)
 *        router.get('/staff',      authenticate, authorize('admin', 'instructor'), handler)
 *
 * NOTE: 'superadmin' implicitly passes ALL role checks.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied. Not authenticated.' });
    }
    // superadmin bypasses every role restriction
    if (req.user.role === 'superadmin') return next();
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = authorize;

