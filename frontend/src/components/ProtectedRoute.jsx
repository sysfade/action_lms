import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users (with an optional role list) can access it.
 *
 * @param {string[]} [allowedRoles]  - if provided, user.role must be in this list
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Wait for auth state to be resolved before deciding
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Authenticated but wrong role — send back to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
