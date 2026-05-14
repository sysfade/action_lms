import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById, updateLesson, deleteLesson, uploadFile } from '../api/lessons';
import Navbar from '../components/Navbar';
import AssessmentManager from '../components/AssessmentManager';
import MarkdownEditor from '../components/MarkdownEditor';
import { useToast } from '../context/ToastContext';

export default function LessonEdit() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { error: toastError, confirm } = useToast();

  const [form, setForm] = useState({
    title: '',
    content: '',
    content_url: '',
    order_index: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getLessonById(lessonId)
      .then((data) => {
        setForm({
          title: data.title,
          content: data.content || '',
          content_url: data.content_url || '',
          order_index: data.order_index,
          course_id: data.course_id // stored for navigation back
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const res = await uploadFile(file);
      setForm((prev) => ({ ...prev, content_url: res.url }));
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return setError('Title is required.');

    setSaving(true);
    try {
      await updateLesson(lessonId, form);
      navigate(`/courses/${form.course_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm('Are you sure you want to delete this lesson?', {
      confirmLabel: 'Delete', cancelLabel: 'Cancel', danger: true,
    });
    if (!ok) return;
    try {
      await deleteLesson(lessonId);
      navigate(`/courses/${form.course_id}`);
    } catch (err) {
      toastError(err.message);
    }
  };

  if (loading) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main"><p>Loading lesson...</p></main>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Edit Lesson</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>Update your educational content.</p>
            </div>
            <button className="btn-logout" onClick={handleDelete} style={{ width: 'auto' }}>Delete Lesson</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="dashboard-card" onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Lesson Title</label>
              <input
                className="form-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Setting up your environment"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Order Index</label>
                <input
                  className="form-input"
                  type="number"
                  name="order_index"
                  value={form.order_index}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content URL / Upload (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    name="content_url"
                    value={form.content_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/... or upload file"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <input
                    type="file"
                    id="file-upload"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn btn-secondary"
                    style={{ cursor: uploading ? 'default' : 'pointer', margin: 0, padding: '0.5rem 1rem', whiteSpace: 'nowrap', opacity: uploading ? 0.7 : 1 }}
                  >
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lesson Content</label>
              <MarkdownEditor
                value={form.content}
                onChange={handleChange}
                rows={16}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 0 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn-secondary" type="button" onClick={() => navigate(-1)} style={{ width: 'auto' }}>
                Cancel
              </button>
            </div>
          </form>

          {/* Assessment Management UI */}
          <AssessmentManager lessonId={lessonId} />
        </div>
      </main>
    </div>
  );
}
