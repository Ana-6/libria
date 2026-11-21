import { getToken } from './authService';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}/admin${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error en la administración.');
  }

  return data;
};

// Panel
export const getDashboard = () => request('/dashboard');

// Libros
export const getAdminBooks = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  return request(`/books?${params.toString()}`);
};

export const getAdminOptions = () => request('/options');

export const createBook = (data) => request('/books', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateBook = (id, data) => request(`/books/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const updateBookStatus = (id, publication_status) =>
  request(`/books/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ publication_status })
  });

export const deleteBook = (id) => request(`/books/${id}`, {
  method: 'DELETE'
});

// Archivos PDF y EPUB
export const getBookFiles = (bookId) =>
  request(`/books/${bookId}/files`);

export const uploadBookFile = (bookId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return request(`/books/${bookId}/files`, {
    method: 'POST',
    body: formData
  });
};

export const deleteBookFile = (fileId) =>
  request(`/files/${fileId}`, {
    method: 'DELETE'
  });

// Autores
export const getAdminAuthors = () => request('/authors');

export const createAuthor = (data) => request('/authors', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateAuthor = (id, data) => request(`/authors/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteAuthor = (id) => request(`/authors/${id}`, {
  method: 'DELETE'
});

// Categorías
export const getAdminCategories = () => request('/categories');

export const createCategory = (data) => request('/categories', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateCategory = (id, data) => request(`/categories/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteCategory = (id) => request(`/categories/${id}`, {
  method: 'DELETE'
});

// Capítulos
export const getAdminChapters = (bookId) =>
  request(`/books/${bookId}/chapters`);

export const createChapter = (bookId, data) =>
  request(`/books/${bookId}/chapters`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateChapter = (id, data) =>
  request(`/chapters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteChapter = (id) =>
  request(`/chapters/${id}`, {
    method: 'DELETE'
  });

// Usuarios
export const getAdminUsers = () => request('/users');

export const updateUser = (id, data) =>
  request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
