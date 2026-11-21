
const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  ).replace(/\/$/, '');
  
  // ==========================================
  // FUNCIÓN GENERAL PARA PETICIONES
  // ==========================================
  
  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error en el servidor.');
    }
  
    return data;
  }
  
  // ==========================================
  // REGISTRAR USUARIO
  // ==========================================
  
  export async function registerUser(form) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password
      })
    });
  }
  
  // ==========================================
  // INICIAR SESIÓN
  // ==========================================
  
  export async function loginUser(email, password, rememberMe = false) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password
      })
    });
  
    // Guardar el token según la preferencia del usuario
    if (rememberMe) {
      localStorage.setItem('libria_token', data.token);
      sessionStorage.removeItem('libria_token');
    } else {
      sessionStorage.setItem('libria_token', data.token);
      localStorage.removeItem('libria_token');
    }
  
    return data;
  }
  
  // ==========================================
  // OBTENER TOKEN GUARDADO
  // ==========================================
  
  export function getToken() {
    return (
      localStorage.getItem('libria_token') ||
      sessionStorage.getItem('libria_token')
    );
  }
  
  // ==========================================
  // OBTENER PERFIL DEL USUARIO
  // ==========================================
  
  export async function getCurrentUser() {
    const token = getToken();
  
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }
  
    return apiRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // ==========================================
  // CERRAR SESIÓN
  // ==========================================
  
  export function logoutUser() {
    localStorage.removeItem('libria_token');
    sessionStorage.removeItem('libria_token');
  }
  