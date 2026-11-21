const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

const request = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo completar la solicitud.');
  }

  return data;
};

export const getAuthors = async (search = '') => {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const query = params.toString();

  const data = await request(
    `/authors${query ? `?${query}` : ''}`
  );

  return data.authors || [];
};

export const getAuthorById = async (authorId) => {
  const data = await request(`/authors/${authorId}`);
  return data.author;
};
