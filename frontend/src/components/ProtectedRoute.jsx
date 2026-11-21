
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Esperar a que termine la comprobación de sesión
  if (loading) {
    return (
      <div className="route-loading">
        <p>Cargando Libria...</p>
      </div>
    );
  }

  // Si no hay sesión, enviar al login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
