import { useState, useEffect } from 'react';
import { listPendingSubmissions, getSubmissionDetails, submitGrade } from '../api/assessments';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';

export default function GradingDashboard() {
  const { success, error: toastError } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await listPendingSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSelect = async (id) => {
    try {
      const data = await getSubmissionDetails(id);
      setSelectedSub(data);
      setScore(data.submission.total_score || '');
      setFeedback(data.submission.instructor_feedback || '');
    } catch (err) {
      toastError('Failed to load submission details');
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    try {
      setGrading(true);
      await submitGrade(selectedSub.submission.id, parseFloat(score), feedback);
      success('Grade submitted successfully!');
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      toastError(err.message || 'Grading failed');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div className={selectedSub ? 'grid-grading' : 'grid-grading-empty'}>
          
          {/* Submissions List */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Grading Inbox</h2>
            {loading ? <p>Loading...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submissions.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)' }}>No pending submissions.</p>
                ) : submissions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => handleSelect(s.id)}
                    style={{ 
                      padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: selectedSub?.submission.id === s.id ? 'var(--color-primary)' : 'var(--color-border)',
                      boxShadow: selectedSub?.submission.id === s.id ? '0 4px 12px rgba(37,99,235,0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9375rem' }}>{s.student_name}</strong>
                      <span className={`role-badge ${s.assessment_type}`} style={{ fontSize: '0.65rem' }}>{s.assessment_type}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{s.assessment_title}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>Submitted: {new Date(s.submitted_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail View */}
          {selectedSub && (
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Reviewing {selectedSub.submission.student_name}'s Work</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{selectedSub.assessment.title}</p>
                </div>
                <button className="btn-logout" onClick={() => setSelectedSub(null)}>Close</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                {selectedSub.questions.map((q, idx) => {
                  const ans = selectedSub.answers.find(a => a.question_id === q.id);
                  return (
                    <div key={q.id}>
                      <h4 style={{ marginBottom: '0.75rem' }}>{idx + 1}. {q.question_text} <span style={{ opacity: 0.5, fontWeight: 400 }}>({q.points} pt)</span></h4>
                      
                      {q.type === 'mcq' && (
                         <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                            Student chose: <strong>{q.options.find(o => o.id === ans?.selected_option_id)?.option_text || 'None'}</strong>
                            <br />
                            Correct answer: <span style={{ color: 'var(--color-success)' }}>{q.options.find(o => o.is_correct === 1)?.option_text}</span>
                         </div>
                      )}

                      {q.type === 'written' && (
                        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', borderLeft: '4px solid var(--color-border)' }}>
                           {ans?.text_answer || <span style={{ fontStyle: 'italic' }}>No answer provided.</span>}
                        </div>
                      )}

                      {ans?.file_url && (
                        <div style={{ marginTop: '1.5rem' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <h5>📎 Attachment</h5>
                             <a href={`http://localhost:5000${ans.file_url}`} download target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                               ⬇️ Download
                             </a>
                           </div>
                           <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', marginTop: '0.5rem' }}>
                              {ans.file_url.toLowerCase().endsWith('.pdf') ? (
                                <object data={`http://localhost:5000${ans.file_url}`} type="application/pdf" width="100%" height="600px">
                                  <p>Your browser does not support PDFs. <a href={`http://localhost:5000${ans.file_url}`}>Download the PDF</a>.</p>
                                </object>
                              ) : (
                                <img 
                                  src={`http://localhost:5000${ans.file_url}`} 
                                  alt="Student upload" 
                                  style={{ maxWidth: '100%', display: 'block' }}
                                />
                              )}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                <form onSubmit={handleGrade}>
                  <div className="grid-form">
                     <div className="form-group">
                        <label className="form-label">Points</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={score}
                          onChange={(e) => setScore(e.target.value)}
                          required
                        />
                     </div>
                     <div className="form-group">
                        <label className="form-label">Feedback (Optional)</label>
                        <textarea 
                          className="form-input" 
                          rows="3" 
                          placeholder="Tell the student how they did..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                        />
                     </div>
                  </div>
                  <button type="submit" disabled={grading} className="btn btn-primary" style={{ width: 'auto', paddingLeft: '3rem', paddingRight: '3rem' }}>
                    {grading ? 'Submitting...' : 'Mark as Graded'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
