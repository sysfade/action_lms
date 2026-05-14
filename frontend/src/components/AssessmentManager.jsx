import { useState, useEffect } from 'react';
import { getLessonAssessment, upsertAssessment } from '../api/assessments';
import { useToast } from '../context/ToastContext';

export default function AssessmentManager({ lessonId }) {
  const { success, error: toastError } = useToast();
  const [assessment, setAssessment] = useState({
    title: '',
    description: '',
    type: 'quiz',
    duration_minutes: '',
    deadline: '',
    passing_score: 60,
    allow_multiple_attempts: false,
    questions: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLessonAssessment(lessonId)
      .then(data => {
        if (data) {
          setAssessment({
            ...data,
            duration_minutes: data.duration_minutes || '',
            deadline: data.deadline ? data.deadline.slice(0, 16) : '',
            allow_multiple_attempts: !!data.allow_multiple_attempts,
            questions: data.questions || []
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const addQuestion = (type) => {
    const newQuestion = {
      question_text: '',
      type: type,
      points: 1,
      options: type === 'mcq' ? [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false }
      ] : []
    };
    setAssessment(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
  };

  const updateQuestion = (idx, field, value) => {
    setAssessment(prev => {
      const qs = [...prev.questions];
      qs[idx] = { ...qs[idx], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setAssessment(prev => {
      const qs = [...prev.questions];
      const opts = [...qs[qIdx].options];
      
      if (field === 'is_correct' && value === true) {
        // Only one correct option for MCQ in this simple impl
        opts.forEach(o => o.is_correct = false);
      }
      
      opts[oIdx] = { ...opts[oIdx], [field]: value };
      qs[qIdx] = { ...qs[qIdx], options: opts };
      return { ...prev, questions: qs };
    });
  };

  const removeQuestion = (idx) => {
    setAssessment(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await upsertAssessment(lessonId, assessment);
      success('Assessment saved successfully!');
    } catch (err) {
      toastError(err.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading assessment manager...</p>;

  return (
    <div className="assessment-manager-container" style={{ marginTop: '3rem', borderTop: '2px solid var(--color-border)', paddingTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Assessment Settings</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>Configure quizzes or assignments for this lesson.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>

      <div className="dashboard-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input" 
              value={assessment.title}
              onChange={e => setAssessment({...assessment, title: e.target.value})}
              placeholder="e.g. Weekly Knowledge Check"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select 
              className="form-select" 
              value={assessment.type}
              onChange={e => setAssessment({...assessment, type: e.target.value})}
            >
              <option value="quiz">Interactive Quiz (MCQ/Written)</option>
              <option value="assignment">Scanned Assignment (File Upload)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Timer (Minutes, optional)</label>
            <input 
              type="number" 
              className="form-input" 
              value={assessment.duration_minutes}
              onChange={e => setAssessment({...assessment, duration_minutes: e.target.value})}
              placeholder="e.g. 30"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input 
              type="datetime-local" 
              className="form-input" 
              value={assessment.deadline}
              onChange={e => setAssessment({...assessment, deadline: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Passing Score %</label>
            <input 
              type="number" 
              className="form-input" 
              value={assessment.passing_score}
              onChange={e => setAssessment({...assessment, passing_score: e.target.value})}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="allow_multiple"
              checked={assessment.allow_multiple_attempts}
              onChange={e => setAssessment({...assessment, allow_multiple_attempts: e.target.checked})}
              style={{ width: '1.25rem', height: '1.25rem' }}
            />
            <label htmlFor="allow_multiple" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Allow Multiple Attempts
            </label>
          </div>
        </div>
      </div>

      <div className="questions-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Questions ({assessment.questions.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="btn-logout" onClick={() => addQuestion('mcq')}>+ MCQ</button>
             <button className="btn-logout" onClick={() => addQuestion('written')}>+ Written</button>
          </div>
        </div>

        {assessment.questions.map((q, qIdx) => (
          <div key={qIdx} className="dashboard-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
               <span className="role-badge student">{q.type.toUpperCase()}</span>
               <button onClick={() => removeQuestion(qIdx)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}>Remove</button>
            </div>
            
            <input 
              className="form-input" 
              value={q.question_text}
              onChange={e => updateQuestion(qIdx, 'question_text', e.target.value)}
              placeholder="Question text..."
              style={{ marginBottom: '1rem', fontStyle: 'italic' }}
            />

            {q.type === 'mcq' && (
              <div style={{ paddingLeft: '1rem' }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="radio" 
                      checked={opt.is_correct} 
                      onChange={() => updateOption(qIdx, oIdx, 'is_correct', true)}
                    />
                    <input 
                      className="form-input" 
                      value={opt.option_text}
                      onChange={e => updateOption(qIdx, oIdx, 'option_text', e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      style={{ fontSize: '0.875rem' }}
                    />
                  </div>
                ))}
                <button 
                  className="btn-secondary" 
                  style={{ fontSize: '0.75rem', width: 'auto', padding: '0.25rem 0.5rem' }}
                  onClick={() => {
                    const opts = [...q.options, { option_text: '', is_correct: false }];
                    updateQuestion(qIdx, 'options', opts);
                  }}
                >+ Add Option</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
