import { API_URL } from './config';
const BASE_COURSES = '/api/courses';
const BASE_LESSONS = '/api/lessons';

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

export const listLessonsForCourse = (courseId) =>
  fetch(`${BASE_COURSES}/${courseId}/lessons`, { headers: getAuthHeaders() }).then(handleResponse);

export const getLessonById = (id) =>
  fetch(`${BASE_LESSONS}/${id}`, { headers: getAuthHeaders() }).then(handleResponse);

export const createLesson = (courseId, payload) =>
  fetch(`${BASE_COURSES}/${courseId}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateLesson = (id, payload) =>
  fetch(`${BASE_LESSONS}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteLesson = (id) =>
  fetch(`${BASE_LESSONS}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const toggleLessonCompletion = (id) =>
  fetch(`${BASE_LESSONS}/${id}/toggle-completion`, {
    method: 'POST',
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('lms_token');
  return fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do not set Content-Type, fetch will automatically set it with the correct boundary for multipart/form-data
    },
    body: formData,
  }).then(handleResponse);
};
