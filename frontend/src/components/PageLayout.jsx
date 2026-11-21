import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Library,
  LogOut,
  Menu,
  UserRound,
  X
} from 'lucide-react';
import { useState } from 'react';

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import './PageLayout.css';

function PageLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = user?.first_name || 'Usuario';
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ') || 'Usuario';

  const initials = fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/', { replace: true });
  };

  const closeMenus = () => {
    setProfileOpen(false);
    setMobileOpen(false);
  };

  return (
    <div className="libria-page">

      <header className="libria-page-header">

        <Link to="/" className="libria-page-logo" onClick={closeMenus}>
          <BookOpen size={25} />
          <span>LIBRIA</span>
        </Link>

        <button
          className="libria-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir navegación"
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <nav className={`libria-page-nav ${mobileOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/" onClick={closeMenus}>Inicio</NavLink>
          <NavLink to="/explorar" onClick={closeMenus}>Explorar</NavLink>
          <NavLink to="/categorias" onClick={closeMenus}>Categorías</NavLink>
          <NavLink to="/autores" onClick={closeMenus}>Autores</NavLink>
          <NavLink to="/comunidad" onClick={closeMenus}>Comunidad</NavLink>
          
          {user?.role === 'admin' && (
  <NavLink to="/admin" onClick={closeMenus}>
    Administración
  </NavLink>
)}
          {isAuthenticated && (
            <NavLink to="/biblioteca" onClick={closeMenus}>
              Mi biblioteca
            </NavLink>
          )}

        

        </nav>

        <div className="libria-header-actions">

          {isAuthenticated ? (
            <div className="libria-profile-container">

              <button
                className={`libria-profile-button ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
              >
                <span className="libria-avatar">
                  {initials}
                </span>

                <span className="libria-profile-name">
                  {firstName}
                </span>

                <ChevronDown size={16} />
              </button>

              {profileOpen && (
                <div className="libria-profile-dropdown">

                  <div className="libria-dropdown-user">
                    <strong>{fullName}</strong>
                    <span>{user?.email}</span>
                  </div>

                  <div className="libria-dropdown-divider" />

                  <Link
                    to="/perfil"
                    onClick={closeMenus}
                  >
                    <UserRound size={17} />
                    Mi perfil
                  </Link>

                  <Link
                    to="/biblioteca"
                    onClick={closeMenus}
                  >
                    <Library size={17} />
                    Mi biblioteca
                  </Link>

                  <div className="libria-dropdown-divider" />

                  <button
                    className="libria-logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} />
                    Cerrar sesión
                  </button>

                </div>
              )}

            </div>
          ) : (
            <div className="libria-guest-actions">
              <Link to="/login" className="libria-login-link">
                Iniciar sesión
              </Link>

              <Link to="/registro" className="libria-register-link">
                Crear cuenta
              </Link>
            </div>
          )}

        </div>

        <Link to="/" className="libria-back-home">
          <ArrowLeft size={16} />
          Volver
        </Link>

      </header>

      <main className="libria-page-content">
        {children}
      </main>

      <footer className="libria-page-footer">
        <span>LIBRIA</span>
        <p>Un universo de historias por descubrir.</p>
        <small>© 2026 Libria. Todos los derechos reservados.</small>
      </footer>

    </div>
  );
}

export default PageLayout;
