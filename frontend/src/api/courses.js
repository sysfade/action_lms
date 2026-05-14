import { API_URL } from './config';
const BASE = `${API_URL}/api/courses`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('lms_token');
  return {
    'Content-Type': 'application/json',
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

export const listAllCourses = () =>
  fetch(`${BASE}`, { headers: getAuthHeaders() }).then(handleResponse);

export const getCourseById = (id) =>
  fetch(`${BASE}/${id}`, { headers: getAuthHeaders() }).then(handleResponse);

export const createCourse = (payload) =>
  fetch(`${BASE}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateCourse = (id, payload) =>
  fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteCourse = (id) =>
  fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const enrollInCourse = (id) =>
  fetch(`${BASE}/${id}/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const unenrollFromCourse = (id) =>
  fetch(`${BASE}/${id}/enroll`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const listMyCourses = () =>
  fetch(`${BASE}/me`, { headers: getAuthHeaders() }).then(handleResponse);

export const listCourseEnrollments = (id) =>
  fetch(`${BASE}/${id}/enrollments`, { headers: getAuthHeaders() }).then(handleResponse);
