
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Eye,
    EyeOff,
    Lock,
    Mail,
    User
} from 'lucide-react';
  
  import { useState } from 'react';
import { Link } from 'react-router-dom';
  
  import { registerUser } from '../../services/authService';
  
  import './Auth.css';
  
  function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    const [form, setForm] = useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    });
  
    const handleChange = (event) => {
      const { name, value, type, checked } = event.target;
  
      setForm((previous) => ({
        ...previous,
        [name]: type === 'checkbox' ? checked : value
      }));
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
  
      setError('');
      setSuccess('');
  
      if (form.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
  
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
  
      if (!form.terms) {
        setError('Debes aceptar los términos y condiciones.');
        return;
      }
  
      try {
        setLoading(true);
  
        const data = await registerUser(form);
  
        setSuccess(data.message);
  
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          terms: false
        });
  
      } catch (err) {
        setError(err.message || 'No se pudo crear la cuenta.');
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
  
        <div className="auth-container auth-register-container">
  
          <div className="auth-brand">
            <BookOpen size={32} />
            <span>libria<span>.</span></span>
          </div>
  
          <div className="auth-heading">
            <span className="auth-eyebrow">COMIENZA TU HISTORIA</span>
            <h1>Tu próximo capítulo <em>comienza aquí.</em></h1>
            <p>
              Crea tu cuenta y comienza a construir una
              biblioteca llena de historias especiales.
            </p>
          </div>
  
          <form className="auth-form" onSubmit={handleSubmit}>
  
            <div className="auth-two-columns">
  
              <div className="auth-field">
                <label htmlFor="firstName">Nombre</label>
  
                <div className="auth-input-wrapper">
                  <User size={18} />
                  <input
                    id="firstName"
                    name="firstName"
                    placeholder="Tu nombre"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
  
              <div className="auth-field">
                <label htmlFor="lastName">Apellido</label>
  
                <div className="auth-input-wrapper">
                  <User size={18} />
                  <input
                    id="lastName"
                    name="lastName"
                    placeholder="Tu apellido"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
  
            </div>
  
            <div className="auth-field">
              <label htmlFor="register-email">Correo electrónico</label>
  
              <div className="auth-input-wrapper">
                <Mail size={18} />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
  
            <div className="auth-field">
              <label htmlFor="register-password">Contraseña</label>
  
              <div className="auth-input-wrapper">
                <Lock size={18} />
  
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />
  
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
  
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
  
              <div className="auth-input-wrapper">
                <Lock size={18} />
  
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
  
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Mostrar u ocultar confirmación"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
  
            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
              />
  
              <span>
                Acepto los términos y condiciones de Libria.
              </span>
            </label>
  
            {error && (
              <div className="auth-feedback auth-error" role="alert">
                {error}
              </div>
            )}
  
            {success && (
              <div className="auth-feedback auth-success" role="status">
                {success}
                <p>
                  ¡Tu cuenta ya está creada! Ahora puedes iniciar sesión.
                </p>
              </div>
            )}
  
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
              {!loading && <ArrowRight size={17} />}
            </button>
  
          </form>
  
          <div className="auth-switch">
            ¿Ya tienes una cuenta?
            <Link to="/login">Iniciar sesión</Link>
          </div>
  
        </div>
  
        <footer className="auth-footer">
          © 2026 Libria. Hecho para quienes aman las historias.
        </footer>
  
      </div>
    );
  }
  
  export default Register;
  