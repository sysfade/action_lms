import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, updateCourse } from '../api/courses';
import Navbar from '../components/Navbar';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCourseById(id)
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description || '',
          category: data.category || '',
          status: data.status,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return setError('Title is required.');

    setSaving(true);
    try {
      await updateCourse(id, form);
      navigate(`/courses/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main"><p>Loading course data...</p></main>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Edit Course</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Update your course details below.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form className="dashboard-card" onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Course Title</label>
              <input
                className="form-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Introduction to React"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                className="form-input"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Web Development"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What will students learn in this course?"
                rows="6"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Public)</option>
              </select>
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
        </div>
      </main>
    </div>
  );
}
