
import {
    Lock,
    Save,
    ShieldCheck,
    UserRound
} from 'lucide-react';
import { useState } from 'react';

import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../services/authService';

import './Profile.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '');

function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || ''
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Actualizar los campos personales.
  const updateField = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Actualizar los campos de contraseña.
  const updatePasswordField = (e) => {
    const { name, value } = e.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Función para realizar peticiones autenticadas al backend.
  const request = async (endpoint, body) => {
    const token = getToken();

    if (!token) {
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error.');
    }

    return data;
  };

  // Guardar información personal.
  const saveProfile = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const data = await request('/auth/me', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim()
      });

      if (!data.user) {
        throw new Error('No se recibió la información actualizada.');
      }

      // Actualizar el contexto global.
      updateUser(data.user);

      // Sincronizar el formulario.
      setForm({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        email: data.user.email
      });

      setMessage('Tus datos se actualizaron correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña.
  const savePassword = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const data = await request('/auth/me/password', passwords);

      setMessage(data.message || 'Tu contraseña se cambió correctamente.');

      setPasswords({
        current_password: '',
        new_password: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="profile-page">

        <span className="libria-section-label">
          MI CUENTA
        </span>

        <h1 className="libria-page-title">
          Mi perfil
        </h1>

        <p className="libria-page-description">
          Administra tu información personal y la seguridad de tu cuenta.
        </p>

        {message && (
          <div className="profile-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="profile-error" role="alert">
            {error}
          </div>
        )}

        {/* Información personal */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <UserRound size={22} />

            <div>
              <h2>Información personal</h2>
              <p>Actualiza los datos de tu cuenta.</p>
            </div>
          </div>

          <form onSubmit={saveProfile}>

            <div className="profile-form-grid">

              <label>
                Nombre

                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={updateField}
                  autoComplete="given-name"
                  required
                />
              </label>

              <label>
                Apellido

                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={updateField}
                  autoComplete="family-name"
                  required
                />
              </label>

              <label className="profile-full-width">
                Correo electrónico

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </label>

            </div>

            <button
              type="submit"
              className="profile-submit"
              disabled={loading}
            >
              <Save size={17} />

              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>

          </form>

        </section>

        {/* Seguridad */}
        <section className="profile-card">

          <div className="profile-card-heading">
            <ShieldCheck size={22} />

            <div>
              <h2>Seguridad</h2>
              <p>Cambia la contraseña de tu cuenta.</p>
            </div>
          </div>

          <form onSubmit={savePassword}>

            <div className="profile-form-grid">

              <label className="profile-full-width">
                Contraseña actual

                <input
                  type="password"
                  name="current_password"
                  value={passwords.current_password}
                  onChange={updatePasswordField}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label className="profile-full-width">
                Nueva contraseña

                <input
                  type="password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={updatePasswordField}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

            </div>

            <button
              type="submit"
              className="profile-submit"
              disabled={loading}
            >
              <Lock size={17} />

              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>

          </form>

        </section>

      </div>
    </PageLayout>
  );
}

export default Profile;
