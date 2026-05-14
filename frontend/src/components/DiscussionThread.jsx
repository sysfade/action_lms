import { useState, useEffect } from 'react';
import { getDiscussions, postComment, deleteComment } from '../api/discussions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DiscussionThread({ lessonId }) {
  const { user } = useAuth();
  const { success, error: toastError, confirm } = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // ID of parent comment
  const [replyText, setReplyText] = useState('');

  const fetchDiscussions = async () => {
    try {
      const data = await getDiscussions(lessonId);
      setThreads(data);
    } catch (err) {
      toastError('Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [lessonId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await postComment(lessonId, newComment);
      setNewComment('');
      success('Comment posted!');
      fetchDiscussions();
    } catch (err) {
      toastError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handlePostReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      await postComment(lessonId, replyText, parentId);
      setReplyText('');
      setReplyingTo(null);
      success('Reply posted!');
      fetchDiscussions();
    } catch (err) {
      toastError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('Delete this comment?', { danger: true });
    if (!confirmed) return;
    try {
      await deleteComment(id);
      success('Comment deleted.');
      fetchDiscussions();
    } catch (err) {
      toastError(err.message);
    }
  };

  const canDelete = (authorId) => {
    return user.id === authorId || user.role === 'admin' || user.role === 'superadmin' || user.role === 'instructor';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderComment = (c, isReply = false) => {
    const isInstructor = c.user_role === 'instructor' || c.user_role === 'admin' || c.user_role === 'superadmin';
    const initials = c.user_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div key={c.id} style={{ 
        display: 'flex', gap: '1rem', 
        padding: '1rem', 
        background: isInstructor ? '#F0FDF4' : '#fff',
        border: `1px solid ${isInstructor ? '#86EFAC' : 'var(--color-border)'}`,
        borderRadius: 12,
        marginBottom: isReply ? '0.75rem' : '1.5rem',
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: isInstructor ? '#16A34A' : '#EFF6FF', 
          color: isInstructor ? '#fff' : '#1D4ED8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 800,
          border: isInstructor ? 'none' : '1px solid #BFDBFE'
        }}>
          {initials}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{c.user_name}</span>
              {isInstructor && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                  INSTRUCTOR
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</span>
              {canDelete(c.user_id) && (
                <button onClick={() => handleDelete(c.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', opacity: 0.6, fontSize: '0.9rem', padding: 0 }}>
                  🗑️
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.5, marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
            {c.message}
          </p>

          {/* Reply Action */}
          {!isReply && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                💬 Reply
              </button>
            </div>
          )}

          {/* Reply Input Box */}
          {replyingTo === c.id && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Write a reply..." 
                value={replyText} 
                onChange={e => setReplyText(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(c.id); }}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
              />
              <button className="btn-primary" onClick={() => handlePostReply(c.id)} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Post
              </button>
            </div>
          )}

          {/* Render Replies */}
          {c.replies && c.replies.length > 0 && (
            <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--color-border)' }}>
              {c.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading discussion...</div>;

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        💬 Discussion Forum
      </h3>

      {/* Post new top-level comment */}
      <form onSubmit={handlePostComment} style={{ marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: '#EFF6FF', color: '#1D4ED8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 800, border: '1px solid #BFDBFE'
        }}>
          {(user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Ask a question or share your thoughts..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          <button type="submit" className="btn-primary" disabled={posting || !newComment.trim()} style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* List Threads */}
      {threads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#F8FAFC', borderRadius: 12, color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}>
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div>
          {threads.map(thread => renderComment(thread))}
        </div>
      )}
    </div>
  );
}
