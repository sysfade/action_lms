import { API_URL } from './config';
const BASE = `${API_URL}/api/notifications`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('lms_token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

const handleResponse = async (res) => {
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse JSON:', text);
    }
  }
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

export const listNotifications = () =>
  fetch(`${BASE}`, { headers: getAuthHeaders() }).then(handleResponse);

export const markAsRead = (id) =>
  fetch(`${BASE}/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const markAllRead = () =>
  fetch(`${BASE}/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const deleteNotification = (id) =>
  fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const clearAllNotifications = () =>
  fetch(`${BASE}/clear-all`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

