import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse } from '../api/courses';
import Navbar from '../components/Navbar';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return setError('Title is required.');

    setLoading(true);
    try {
      const newCourse = await createCourse(form);
      navigate(`/courses/${newCourse.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create New Course</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Fill in the details below to start building your course.</p>

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
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 0 }}>
                {loading ? 'Creating...' : 'Create Course'}
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
