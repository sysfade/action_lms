import { API_URL } from './config';
const BASE = '/api';

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

export const getLessonAssessment = (lessonId) =>
  fetch(`${BASE}/lessons/${lessonId}/assessment`, { headers: getAuthHeaders() }).then(handleResponse);

export const submitAssessment = (id, payload, isMultipart = false) => {
  const headers = getAuthHeaders();
  let body;

  if (isMultipart) {
    body = payload; // FormData
    // Don't set Content-Type header when sending FormData, the browser will set it with the boundary
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  return fetch(`${BASE}/assessments/${id}/submit`, {
    method: 'POST',
    headers,
    body,
  }).then(handleResponse);
};

export const listPendingSubmissions = () =>
  fetch(`${BASE}/grading/pending`, { headers: getAuthHeaders() }).then(handleResponse);

export const upsertAssessment = (lessonId, payload) =>
  fetch(`${BASE}/lessons/${lessonId}/assessment`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getSubmissionDetails = (id) =>
  fetch(`${BASE}/submissions/${id}`, { headers: getAuthHeaders() }).then(handleResponse);

export const submitGrade = (id, score, feedback) =>
  fetch(`${BASE}/submissions/${id}/grade`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, feedback }),
  }).then(handleResponse);

export const getMySubmissions = () =>
  fetch(`${BASE}/submissions/mine`, { headers: getAuthHeaders() }).then(handleResponse);
