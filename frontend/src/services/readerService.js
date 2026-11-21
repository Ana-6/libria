import { getToken } from './authService';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

const request = async (url, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar la solicitud.');
  }

  return data;
};

export const getReaderBook = async (bookId, format = '') => {
  const params = format ? `?format=${format}` : '';

  return request(`/reader/books/${bookId}${params}`);
};

export const saveReadingProgress = async (
  bookId,
  position,
  percentage
) => {
  return request(`/reader/books/${bookId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ position, percentage })
  });
};
