import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLessonById, listLessonsForCourse, toggleLessonCompletion } from '../api/lessons';
import Navbar from '../components/Navbar';
import AssessmentPlayer from '../components/AssessmentPlayer';
import DiscussionThread from '../components/DiscussionThread';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';

export default function LessonView() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]); // for navigation
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  const handleToggleCompletion = async () => {
    setToggling(true);
    try {
      const result = await toggleLessonCompletion(lessonId);
      setLesson(prev => ({ ...prev, is_completed: result.completed }));
      // Refresh lesson list to show checkmarks in sidebar
      const updatedList = await listLessonsForCourse(courseId);
      setLessons(updatedList);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [lessonData, lessonsList] = await Promise.all([
          getLessonById(lessonId),
          listLessonsForCourse(courseId)
        ]);
        setLesson(lessonData);
        setLessons(lessonsList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, lessonId]);

  if (loading) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main"><p>Loading lesson...</p></main>
    </div>
  );

  if (error || !lesson) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className="alert alert-error">{error || 'Lesson not found'}</div>
        <button className="btn-secondary" onClick={() => navigate(`/courses/${courseId}`)} style={{ width: 'auto' }}>
          Back to Course
        </button>
      </main>
    </div>
  );

  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className="lesson-layout">
          
          {/* Main content */}
          <div>
            <div className="dashboard-card" style={{ padding: '2.5rem' }}>
               <header style={{ marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Lesson {currentIndex + 1} of {lessons.length}
                  </p>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>{lesson.title}</h1>
               </header>

               {lesson.content_url && (
                 <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', aspectId: '16/9' }}>
                   {/* Simple embed or link placeholder */}
                   <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
                      <p style={{ marginBottom: '1rem' }}>External Content Attached</p>
                      <a href={lesson.content_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: 'auto' }}>
                        View Video/Resource ↗
                      </a>
                   </div>
                 </div>
               )}

               {lesson.content ? (
                 <div className="prose" style={{ maxWidth: '100%', marginBottom: '3rem' }}>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                 </div>
               ) : (
                 <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '3rem' }}>
                   No content provided for this lesson.
                 </p>
               )}

                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                  <button 
                    className={lesson.is_completed ? "btn-secondary" : "btn-primary"}
                    onClick={handleToggleCompletion}
                    disabled={toggling}
                    style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px', justifyContent: 'center' }}
                  >
                    {lesson.is_completed ? (
                      <>
                        <span style={{ fontSize: '1.2rem' }}>✓</span> Completed
                      </>
                    ) : (
                      toggling ? 'Updating...' : 'Mark as Complete'
                    )}
                  </button>
               </div>

               {/* Assessment Section */}
               <AssessmentPlayer lessonId={lessonId} />

               {/* Discussion Forum Section */}
               <DiscussionThread lessonId={lessonId} />

               {/* 🏆 Certificate Banner — shown when all lessons complete */}
               {user?.role === 'student' && lessons.length > 0 && lessons.every(l => l.is_completed) && (
                 <div style={{
                   marginTop: '2rem', padding: '1.5rem 2rem', borderRadius: 14,
                   background: 'linear-gradient(135deg, #FFFDF5 0%, #FEF3C7 100%)',
                   border: '2px solid #D4AF37',
                   textAlign: 'center',
                   boxShadow: '0 4px 20px rgba(212,175,55,0.15)',
                 }}>
                   <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
                   <h3 style={{ fontWeight: 800, color: '#78350F', marginBottom: '0.4rem' }}>
                     Congratulations! Course Complete!
                   </h3>
                   <p style={{ color: '#92400E', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                     You've completed all lessons. Claim your certificate below.
                   </p>
                   <Link to={`/certificates/${courseId}`} style={{
                     display: 'inline-block', padding: '0.65rem 1.75rem', borderRadius: 10,
                     background: 'linear-gradient(135deg, #D4AF37, #F5D97A)',
                     color: '#78350F', textDecoration: 'none',
                     fontWeight: 800, fontSize: '0.9375rem',
                     boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                   }}>
                     🎓 Claim My Certificate
                   </Link>
                 </div>
               )}

               <footer className="footer-actions" style={{ marginTop: '4rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                  {prevLesson ? (
                    <Link to={`/courses/${courseId}/lessons/${prevLesson.id}`} className="btn-secondary" style={{ width: 'auto' }}>
                      ← Previous Lesson
                    </Link>
                  ) : <div />}

                  {nextLesson ? (
                    <Link to={`/courses/${courseId}/lessons/${nextLesson.id}`} className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
                      Next Lesson →
                    </Link>
                  ) : (
                    <Link to={`/courses/${courseId}`} className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
                      Course Complete! →
                    </Link>
                  )}
               </footer>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <aside>
            <div className="dashboard-card" style={{ padding: '1.25rem', position: 'sticky', top: '2rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>Course Curriculum</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lessons.map((l, idx) => (
                  <li key={l.id}>
                     <Link 
                       to={`/courses/${courseId}/lessons/${l.id}`}
                       style={{ 
                         display: 'flex', 
                         alignItems: 'center',
                         justifyContent: 'space-between',
                         padding: '0.625rem 0.875rem', 
                         borderRadius: 'var(--radius-sm)',
                         fontSize: '0.875rem',
                         textDecoration: 'none',
                         background: l.id === lessonId ? 'var(--color-primary-light)' : 'transparent',
                         color: l.id === lessonId ? 'var(--color-primary)' : 'var(--color-text-muted)',
                         fontWeight: l.id === lessonId ? 600 : 400,
                         border: l.id === lessonId ? '1px solid var(--color-primary)' : '1px solid transparent'
                       }}
                     >
                       <span>
                         <span style={{ opacity: 0.6, marginRight: '0.5rem' }}>{idx + 1}.</span> {l.title}
                       </span>
                       {l.is_completed ? (
                         <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                       ) : null}
                     </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
