import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import MyCourses from './pages/MyCourses';
import LessonCreate from './pages/LessonCreate';
import LessonEdit from './pages/LessonEdit';
import LessonView from './pages/LessonView';
import GradingDashboard from './pages/GradingDashboard';
import MyProgress from './pages/MyProgress';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import NotificationCenter from './pages/NotificationCenter';
import Certificate from './pages/Certificate';
import MyCertificates from './pages/MyCertificates';
import Leaderboard from './pages/Leaderboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Auth-protected routes */}
      <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile"          element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/notifications"    element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
      <Route path="/my-certificates"  element={<ProtectedRoute><MyCertificates /></ProtectedRoute>} />
      <Route path="/certificates/:courseId" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
      <Route
        path="/progress"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyProgress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      
      {/* Lesson View (Classroom) */}
      <Route 
        path="/courses/:courseId/lessons/:lessonId" 
        element={<ProtectedRoute><LessonView /></ProtectedRoute>} 
      />

      {/* Instructor/Admin only - Course & Lesson Management */}
      <Route
        path="/courses/new"
        element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <CreateCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <EditCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:courseId/lessons/new"
        element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <LessonCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lessons/:lessonId/edit"
        element={
          <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <LessonEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grading"
        element={
          <ProtectedRoute allowedRoles={['instructor', 'admin', 'superadmin']}>
            <GradingDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
