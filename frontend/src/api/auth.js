import { API_URL } from './config';
const BASE = `${API_URL}/api/auth`;

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

export const registerUser = (payload) =>
  fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const loginUser = (payload) =>
  fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getMe = (token) =>
  fetch(`${BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(handleResponse);

export const updateProfile = (payload) =>
  fetch(`${BASE}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('lms_token')}`,
    },
    body: JSON.stringify(payload),
  }).then(handleResponse);
