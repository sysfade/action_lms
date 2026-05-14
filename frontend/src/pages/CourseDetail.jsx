import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById, enrollInCourse, unenrollFromCourse, deleteCourse } from '../api/courses';
import { listLessonsForCourse } from '../api/lessons';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError, confirm } = useToast();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [courseData, lessonData] = await Promise.all([
        getCourseById(id),
        listLessonsForCourse(id).catch(() => []) // gracefully handle 403/errors for lessons
      ]);
      setCourse(courseData);
      setLessons(lessonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      await enrollInCourse(id);
      fetchData();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleUnenroll = async () => {
    const ok = await confirm('Are you sure you want to unenroll from this course?', {
      confirmLabel: 'Unenroll',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      await unenrollFromCourse(id);
      fetchData();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm('Permanently delete this course? This cannot be undone.', {
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCourse(id);
      navigate('/courses');
    } catch (err) {
      toastError(err.message);
    }
  };

  if (loading) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main"><p>Loading course details...</p></main>
    </div>
  );

  if (error || !course) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className="alert alert-error">{error || 'Course not found'}</div>
        <button className="btn-secondary" onClick={() => navigate('/courses')} style={{ width: 'auto' }}>Back to Catalog</button>
      </main>
    </div>
  );

  const isOwner = course.instructor_id === user?.id;
  const isAdmin = user?.role === 'admin';
  const isEnrolled = course.enrolled;

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="dashboard-card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className={`role-badge ${course.status}`} style={{ margin: 0, marginBottom: '0.75rem' }}>{course.status}</span>
                <span className="role-badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', marginLeft: '0.5rem' }}>
                  {course.category || 'General'}
                </span>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.5px', marginTop: '0.5rem' }}>{course.title}</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
                  Instructed by <strong style={{ color: 'var(--color-text)' }}>{course.instructor_name}</strong>
                </p>
              </div>

              {(isOwner || isAdmin) && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-secondary" onClick={() => navigate(`/courses/${id}/edit`)} style={{ width: 'auto' }}>Edit</button>
                  <button className="btn-logout" onClick={handleDelete} style={{ width: 'auto' }}>Delete</button>
                </div>
              )}
            </div>

            {user?.role === 'student' && isEnrolled && (
              <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                   <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Course Progress</span>
                   <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)' }}>{course.progress_percent}% Complete</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ width: `${course.progress_percent}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            )}

            <hr className="divider" style={{ margin: '2rem 0' }} />

            <div className="course-description">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Course Description</h2>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
                {course.description || 'No description provided for this course.'}
              </p>
            </div>

            <hr className="divider" style={{ margin: '2.5rem 0' }} />

            <div className="course-curriculum">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Curriculum ({lessons.length} Lessons)</h2>
                {(isOwner || isAdmin) && (
                  <Link to={`/courses/${id}/lessons/new`} className="btn-primary" style={{ width: 'auto', marginTop: 0, fontSize: '0.8125rem' }}>
                    + Add Lesson
                  </Link>
                )}
              </div>

              {lessons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {lessons.map((lesson, idx) => (
                    <div 
                      key={lesson.id} 
                      style={{ 
                        padding: '1rem', 
                        background: 'var(--color-bg)', 
                        borderRadius: 'var(--radius-sm)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</span>
                        <div>
                          {isEnrolled || isOwner || isAdmin ? (
                             <Link 
                               to={`/courses/${id}/lessons/${lesson.id}`} 
                               style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--color-text)' }}
                             >
                               {lesson.title}
                             </Link>
                          ) : (
                             <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'not-allowed' }}>
                               🔒 {lesson.title}
                             </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {lesson.is_completed ? (
                          <span style={{ color: 'var(--color-success)', fontWeight: 800, fontSize: '0.875rem' }}>Completed ✓</span>
                        ) : null}
                        
                        {(isOwner || isAdmin) && (
                          <Link 
                            to={`/lessons/${lesson.id}/edit`} 
                            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No lessons have been added to this course yet.</p>
              )}
            </div>

            <hr className="divider" style={{ margin: '2.5rem 0' }} />

            <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {isEnrolled ? 'Keep learning!' : 'Ready to start?'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {isEnrolled 
                      ? 'You have full access to all curriculum materials.' 
                      : 'Get full access to all materials by enrolling.'}
                  </p>
               </div>

               {user?.role === 'student' && (
                 isEnrolled ? (
                    <button className="btn-logout" onClick={handleUnenroll} style={{ width: 'auto' }}>Unenroll</button>
                 ) : (
                    <button className="btn-primary" onClick={handleEnroll} style={{ width: 'auto', marginTop: 0 }}>Enroll Now</button>
                 )
               )}

               {(isOwner || isAdmin) && (
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Instructor View</p>
               )}
            </div>
          </div>

          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ width: 'auto', marginTop: '1.5rem' }}>← Back</button>
        </div>
      </main>
    </div>
  );
}
