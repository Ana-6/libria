
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Eye,
    EyeOff,
    Lock,
    Mail
} from 'lucide-react';
  
  import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
  
  import { useAuth } from '../../context/AuthContext';
  
  import './Auth.css';
  
  function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
  
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
  
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      setError('');
      setSuccess('');
  
      try {
        setLoading(true);
  
        const data = await login(
          email,
          password,
          rememberMe
        );
  
        setSuccess('¡Bienvenida de nuevo a Libria!');
  
        console.log('Usuario autenticado:', data.user);
  
        setTimeout(() => {
          navigate('/');
        }, 1000);
  
      } catch (error) {
        setError(
          error.message || 'No fue posible iniciar sesión.'
        );
  
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="auth-page">
  
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} />
          Volver a Libria
        </Link>
  
        <div className="auth-container">
  
          <div className="auth-brand">
            <BookOpen size={32} />
            <span>libria<span>.</span></span>
          </div>
  
          <div className="auth-heading">
            <span className="auth-eyebrow">
              TU UNIVERSO LITERARIO
            </span>
  
            <h1>
              Qué bueno tenerte <em>de vuelta.</em>
            </h1>
  
            <p>
              Inicia sesión y continúa descubriendo historias
              que merecen un lugar en tu biblioteca.
            </p>
          </div>
  
          <form className="auth-form" onSubmit={handleSubmit}>
  
            <div className="auth-field">
              <label htmlFor="login-email">
                Correo electrónico
              </label>
  
              <div className="auth-input-wrapper">
                <Mail size={18} />
  
                <input
                  id="login-email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
  
            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">
                  Contraseña
                </label>
  
                <Link to="/recuperar-password">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
  
              <div className="auth-input-wrapper">
                <Lock size={18} />
  
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
  
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
                </button>
              </div>
            </div>
  
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
  
              <span>Recordar mi sesión</span>
            </label>
  
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
  
            {success && (
              <div className="auth-success" role="status">
                {success}
              </div>
            )}
  
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
  
              {!loading && <ArrowRight size={17} />}
            </button>
  
          </form>
  
          <div className="auth-switch">
            ¿Todavía no tienes una cuenta?
            <Link to="/registro">Crear una cuenta</Link>
          </div>
  
          <div className="auth-divider">
            <span>UN UNIVERSO DE HISTORIAS TE ESPERA</span>
          </div>
  
        </div>
  
        <footer className="auth-footer">
          © 2026 Libria. Hecho para quienes aman las historias.
        </footer>
  
      </div>
    );
  }
  
  export default Login;
  