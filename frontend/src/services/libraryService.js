
import { getToken } from './authService';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

const request = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_URL}/library${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Ocurrió un error.');
  }

  return data;
};

export const getLibrary = () => request('/');

export const addBook = (bookId) =>
  request('/', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId })
  });

export const updateBookStatus = (bookId, reading_status) =>
  request(`/${bookId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ reading_status })
  });

export const removeBook = (bookId) =>
  request(`/${bookId}`, { method: 'DELETE' });

export const toggleFavorite = (bookId) =>
  request(`/${bookId}/favorite`, { method: 'PUT' });
