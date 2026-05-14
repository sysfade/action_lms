import { useState, useEffect } from 'react';
import { listMyCourses, enrollInCourse, unenrollFromCourse } from '../api/courses';
import CourseCard from '../components/CourseCard';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function MyCourses() {
  const { user } = useAuth();
  const { error: toastError, confirm } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyCourses = async () => {
    try {
      const data = await listMyCourses();
      // For students, the backend returns joined rows where 'enrolled' isn't explicitly false
      // but the CourseCard expects 'enrolled' property.
      const coursesWithFlag = data.map(c => ({
        ...c,
        enrolled: user?.role === 'student' ? true : c.enrolled
      }));
      setCourses(coursesWithFlag);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const handleEnroll = async (id) => {
    try {
      await enrollInCourse(id);
      fetchMyCourses();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleUnenroll = async (id) => {
    const ok = await confirm('Are you sure you want to unenroll from this course?', {
      confirmLabel: 'Unenroll', cancelLabel: 'Cancel', danger: true,
    });
    if (!ok) return;
    try {
      await unenrollFromCourse(id);
      fetchMyCourses();
    } catch (err) {
      toastError(err.message);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <header className="dashboard-welcome">
          <h1>{user?.role === 'student' ? 'My Learning' : 'My Courses'}</h1>
          <p>
            {user?.role === 'student'
              ? 'Below are the courses you are currently enrolled in.'
              : 'Below are the courses you have created.'}
          </p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Loading your courses...</p>
        ) : courses.length > 0 ? (
          <div className="dashboard-cards">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        ) : (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {user?.role === 'student'
                ? 'You are not enrolled in any courses yet.'
                : 'You haven\'t created any courses yet.'}
            </p>
            {user?.role === 'student' ? (
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => window.location.href = '/courses'}>Explore Catalog</button>
            ) : (
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => window.location.href = '/courses/new'}>Create your first course</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
