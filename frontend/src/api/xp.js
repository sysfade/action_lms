import { API_URL } from './config';
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

export const getMyXP = () =>
  fetch(`${API_URL}/api/xp/me`, { headers: getAuthHeaders() }).then(handleResponse);

export const getLeaderboard = () =>
  fetch(`${API_URL}/api/xp/leaderboard`, { headers: getAuthHeaders() }).then(handleResponse);

export const getMyAchievements = () =>
  fetch(`${API_URL}/api/xp/achievements`, { headers: getAuthHeaders() }).then(handleResponse);
