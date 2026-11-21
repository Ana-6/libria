
const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  ).replace(/\/$/, '');
  
  const request = async (url) => {
    const response = await fetch(url);
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error.');
    }
  
    return data;
  };
  
  export const getBooks = async (filters = {}) => {
    const params = new URLSearchParams();
  
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  
    const data = await request(
      `${API_URL}/books?${params.toString()}`
    );
  
    return data.books || [];
  };
  
  export const getBookCategories = async () => {
    const data = await request(`${API_URL}/books/categories`);
    return data.categories || [];
  };
  
  export const getBookById = async (bookId) => {
    const data = await request(`${API_URL}/books/${bookId}`);
    return data.book;
  };
  