import { API_URL } from './config';
const BASE = `${API_URL}/api/certificates`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('lms_token')}`,
});

const handleResponse = async (res) => {
  const text = await res.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); } catch {}
  }
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

export const issueCertificate = (courseId) =>
  fetch(`${BASE}/${courseId}`, { method: 'POST', headers: getAuthHeaders() }).then(handleResponse);

export const getCertificate = (courseId) =>
  fetch(`${BASE}/${courseId}`, { headers: getAuthHeaders() }).then(handleResponse);

export const getMyCertificates = () =>
  fetch(BASE, { headers: getAuthHeaders() }).then(handleResponse);
