const BASE = '/api/admin';

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

export const getAdminStats  = ()           => fetch(`${BASE}/stats`,            { headers: getAuthHeaders() }).then(handleResponse);
export const listAllUsers   = ()           => fetch(`${BASE}/users`,            { headers: getAuthHeaders() }).then(handleResponse);
export const listAdminCourses = ()         => fetch(`${BASE}/courses`,          { headers: getAuthHeaders() }).then(handleResponse);

export const updateRole = (id, role) =>
  fetch(`${BASE}/users/${id}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  }).then(handleResponse);

export const deleteUser = (id) =>
  fetch(`${BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);
