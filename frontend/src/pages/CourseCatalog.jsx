import { useState, useEffect, useMemo } from 'react';
import { listAllCourses, enrollInCourse, unenrollFromCourse } from '../api/courses';
import CourseCard from '../components/CourseCard';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'az',       label: 'A → Z' },
  { value: 'za',       label: 'Z → A' },
  { value: 'enrolled', label: 'Enrolled First' },
];

export default function CourseCatalog() {
  const { error: toastError, confirm } = useToast();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Filter/sort state
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [sort,     setSort]     = useState('newest');

  const fetchCourses = async () => {
    try {
      const data = await listAllCourses();
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleEnroll = async (id) => {
    try {
      await enrollInCourse(id);
      fetchCourses();
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
      fetchCourses();
    } catch (err) {
      toastError(err.message);
    }
  };

  // Derive category list from data
  const categories = useMemo(() => {
    const cats = [...new Set(courses.map(c => c.category).filter(Boolean))].sort();
    return cats;
  }, [courses]);

  // Apply search + category filter + sort
  const filtered = useMemo(() => {
    let result = [...courses];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.instructor_name || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== 'all') {
      result = result.filter(c => c.category === category);
    }

    // Sort
    switch (sort) {
      case 'oldest':   result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'az':       result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':       result.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'enrolled': result.sort((a, b) => (b.enrolled ? 1 : 0) - (a.enrolled ? 1 : 0)); break;
      default:         result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest
    }

    return result;
  }, [courses, search, category, sort]);

  const hasActiveFilter = search.trim() || category !== 'all' || sort !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSort('newest');
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-welcome" style={{ marginBottom: '1.5rem' }}>
          <h1>Course Catalog</h1>
          <p>Explore all available courses and start learning today.</p>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Search + filters bar */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          marginBottom: '1.75rem', alignItems: 'center',
        }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 0 }}>
            <span style={{
              position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', fontSize: '1rem', pointerEvents: 'none',
            }}>🔍</span>
            <input
              className="form-input"
              placeholder="Search by title, instructor, keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Category filter */}
          <select
            className="form-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="form-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              style={{
                padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--color-border)',
                background: '#fff', cursor: 'pointer', fontSize: '0.8125rem',
                fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex',
                alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <div style={{ marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {hasActiveFilter
              ? `${filtered.length} of ${courses.length} courses match your filters`
              : `${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                height: 260, borderRadius: 16, background: 'var(--color-border)',
                opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="dashboard-cards">
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#fff', borderRadius: 16,
            border: '1px dashed var(--color-border)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>No courses found</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {courses.length === 0
                ? 'No courses have been published yet.'
                : 'Try adjusting your search or clearing the filters.'}
            </p>
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none',
                  background: 'var(--color-primary)', color: '#fff',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
