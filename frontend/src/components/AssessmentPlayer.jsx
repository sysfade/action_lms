import { useState, useEffect, useCallback } from 'react';
import { getLessonAssessment, submitAssessment } from '../api/assessments';
import { useToast } from '../context/ToastContext';

export default function AssessmentPlayer({ lessonId }) {
  const { error: toastError } = useToast();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const loadAssessment = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLessonAssessment(lessonId);
      setAssessment(data);
      if (data?.user_submission && data.user_submission.status !== 'in_progress') {
        setIsSubmitted(true);
        setResult(data.user_submission);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // Timer logic
  useEffect(() => {
    if (isStarted && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (isStarted && timeLeft === 0) {
      handleSubmit(); // Auto-submit on time expiry
    }
  }, [isStarted, timeLeft]);

  const handleStart = () => {
    setIsStarted(true);
    if (assessment.duration_minutes) {
      setTimeLeft(assessment.duration_minutes * 60);
    }
  };

  const handleAnswerChange = (questionId, value, type) => {
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== questionId);
      return [...existing, { 
        questionId, 
        selectedOptionId: type === 'mcq' ? value : null, 
        textAnswer: type === 'written' ? value : null 
      }];
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const isAssignment = assessment.type === 'assignment';
      let payload;

      if (isAssignment && file) {
        payload = new FormData();
        payload.append('answers', JSON.stringify(answers));
        payload.append('scanned_page', file);
      } else {
        payload = { answers };
      }

      const res = await submitAssessment(assessment.id, payload, !!file);
      setIsSubmitted(true);
      setResult(res);
      loadAssessment(); // Refresh completion status
    } catch (err) {
      toastError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading && !assessment) return <div className="loading-dots">Loading assessment...</div>;
  if (!assessment) return null;

  if (isSubmitted) {
    const isGraded = result?.status === 'graded';
    return (
      <div className="assessment-complete-card" style={{
        background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)',
        marginTop: '2rem', boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isGraded ? '🎉' : '⏳'}</div>
          <h2 style={{ marginBottom: '0.5rem' }}>
            {isGraded ? 'Assessment Graded!' : 'Great Work!'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {isGraded 
              ? `You scored ${result.total_score} points.` 
              : 'Your submission is pending review by the instructor.'}
          </p>
          {result?.instructor_feedback && (
            <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', textAlign: 'left', marginBottom: '1.5rem' }}>
              <strong>Feedback:</strong> {result.instructor_feedback}
            </div>
          )}
          {assessment?.allow_multiple_attempts && (
            <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)} style={{ marginBottom: '2rem' }}>
              Retake Assessment
            </button>
          )}
        </div>
        
        {result?.answers && result.answers.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '1rem' }}>Your Submission</h3>
            {assessment.questions?.map((q, idx) => {
              const ans = result.answers.find(a => a.question_id === q.id);
              return (
                <div key={q.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{idx + 1}. {q.question_text}</div>
                  
                  {q.type === 'mcq' && (
                    <div style={{ color: 'var(--color-text-muted)' }}>
                      Selected: {q.options?.find(o => o.id === ans?.selected_option_id)?.option_text || 'None'}
                    </div>
                  )}

                  {q.type === 'written' && (
                     <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', color: 'var(--color-text)' }}>
                       {ans?.text_answer || <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No answer provided</span>}
                     </div>
                  )}

                  {ans?.file_url && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <a href={`http://localhost:5000${ans.file_url}`} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
                        background: '#EEF2FF', color: 'var(--color-primary)', borderRadius: '6px', 
                        textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem'
                      }}>
                        📄 View Uploaded File
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="assessment-intro-card" style={{
        background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)',
        marginTop: '2rem', boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className={`role-badge ${assessment.type}`} style={{ margin: 0 }}>{assessment.type}</span>
          {assessment.deadline && (
             <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
               Due: {new Date(assessment.deadline).toLocaleString()}
             </span>
          )}
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>{assessment.title}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{assessment.description}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-primary-light)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem' }}>⌛</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{assessment.duration_minutes ? `${assessment.duration_minutes}m` : 'No Limit'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Duration</div>
          </div>
          <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem' }}>❓</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{assessment.questions?.length || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Questions</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleStart}>Start Assessment</button>
      </div>
    );
  }

  return (
    <div className="assessment-active-wrapper" style={{ marginTop: '2rem' }}>
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', position: 'sticky', top: '1rem', 
        zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
        padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)',
        marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
         <span style={{ fontWeight: 600 }}>{assessment.title}</span>
         {timeLeft !== null && (
           <span style={{ 
             color: timeLeft < 60 ? 'var(--color-error)' : 'var(--color-primary)', 
             fontWeight: 700, fontFamily: 'monospace' 
           }}>
             {formatTime(timeLeft)}
           </span>
         )}
      </div>

      <form onSubmit={handleSubmit}>
        {assessment.questions?.map((q, idx) => (
          <div key={q.id} style={{ 
            background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ marginBottom: '1rem' }}>{idx + 1}. {q.question_text}</h4>
            
            {q.type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.options?.map(opt => (
                  <label key={opt.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                    border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer',
                    background: answers.find(a => a.selectedOptionId === opt.id) ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: answers.find(a => a.selectedOptionId === opt.id) ? 'var(--color-primary)' : 'var(--color-border)'
                  }}>
                    <input 
                      type="radio" 
                      name={q.id} 
                      onChange={() => handleAnswerChange(q.id, opt.id, 'mcq')}
                      checked={answers.some(a => a.selectedOptionId === opt.id)}
                    />
                    {opt.option_text}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'written' && (
              <textarea 
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Type your answer here..."
                onChange={(e) => handleAnswerChange(q.id, e.target.value, 'written')}
              />
            )}
          </div>
        ))}

        {assessment.type === 'assignment' && (
          <div style={{ 
            background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)',
            marginBottom: '1.5rem' 
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>📸 Upload Scanned Pages</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Upload a clear photo or PDF of your handwritten work.
            </p>
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="form-input"
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
            {loading ? 'Submitting...' : 'Finish Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
