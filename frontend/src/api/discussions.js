const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('lms_token')}`,
});

const handleResponse = async (res) => {
  const text = await res.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch { /* empty */ }
  }
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

export const getDiscussions = (lessonId) =>
  fetch(`/api/lessons/${lessonId}/discussions`, { headers: getAuthHeaders() }).then(handleResponse);

export const postComment = (lessonId, message, parentId = null) =>
  fetch(`/api/lessons/${lessonId}/discussions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, parentId }),
  }).then(handleResponse);

export const deleteComment = (id) =>
  fetch(`/api/discussions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);
