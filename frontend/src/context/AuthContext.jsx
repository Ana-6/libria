
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
  
  import {
    getCurrentUser,
    getToken,
    loginUser,
    logoutUser
} from '../services/authService';
  
  const AuthContext = createContext(null);
  
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
    // Recuperar la sesión cuando se carga Libria.
    useEffect(() => {
      let active = true;
  
      const restoreSession = async () => {
        if (!getToken()) {
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
  
        try {
          const data = await getCurrentUser();
  
          if (active) {
            setUser(data.user);
          }
        } catch (error) {
          logoutUser();
  
          if (active) {
            setUser(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };
  
      restoreSession();
  
      return () => {
        active = false;
      };
    }, []);
  
    // Iniciar sesión.
    const login = useCallback(async (email, password, rememberMe = false) => {
      const data = await loginUser(email, password, rememberMe);
  
      if (!data.user) {
        logoutUser();
        throw new Error('No se pudo obtener la información del usuario.');
      }
  
      setUser(data.user);
  
      return data;
    }, []);
  
    // Cerrar sesión.
    const logout = useCallback(() => {
      logoutUser();
      setUser(null);
    }, []);
  
    // Actualizar los datos del usuario en toda la aplicación.
    const updateUser = useCallback((updatedUser) => {
      setUser(updatedUser);
    }, []);
  
    // Compartir los datos y funciones de autenticación.
    const value = useMemo(() => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      updateUser
    }), [user, loading, login, logout, updateUser]);
  
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  // Hook para utilizar la autenticación en cualquier página.
  export function useAuth() {
    const context = useContext(AuthContext);
  
    if (!context) {
      throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
    }
  
    return context;
  }
  