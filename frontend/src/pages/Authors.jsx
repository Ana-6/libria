import {
  Feather,
  BookOpen,
  Search,
  RefreshCw,
  UserRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PageLayout from '../components/PageLayout';
import { getAuthors } from '../services/authorService';

import './Authors.css';

function Authors() {
  const [authors, setAuthors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadAuthors = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await getAuthors(search);

        if (!cancelled) {
          setAuthors(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(loadAuthors, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  return (
    <PageLayout>
      <main className="authors-page">

        <section className="authors-heading">
          <span className="libria-section-label">
            QUIENES CREAN HISTORIAS
          </span>

          <h1 className="libria-page-title">
            Conoce a nuestros autores.
          </h1>

          <p className="libria-page-description">
            Detrás de cada historia existe una voz.
            Descubre a los escritores de Libria,
            conoce sus obras y encuentra nuevas
            inspiraciones para tu próxima lectura.
          </p>
        </section>

        <section className="authors-search">
          <Search size={21} />

          <input
            type="search"
            placeholder="Buscar un autor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
            >
              Limpiar
            </button>
          )}
        </section>

        <section className="authors-results">

          <div className="authors-results-heading">
            <div>
              <h2>Voces de Libria</h2>
              <p>
                {loading
                  ? 'Cargando autores...'
                  : `${authors.length} ${
                      authors.length === 1
                        ? 'autor encontrado'
                        : 'autores encontrados'
                    }`}
              </p>
            </div>
          </div>

          {loading && (
            <div className="authors-message">
              <RefreshCw
                className="authors-spinner"
                size={27}
              />
              <p>Descubriendo nuestros autores...</p>
            </div>
          )}

          {!loading && error && (
            <div className="authors-message authors-error">
              <Feather size={35} />
              <h3>No pudimos cargar los autores</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={() => setSearch((value) => value)}
              >
                Intentar nuevamente
              </button>
            </div>
          )}

          {!loading && !error && authors.length === 0 && (
            <div className="authors-message">
              <Feather size={40} />

              <h3>
                {search
                  ? 'No encontramos ese autor'
                  : 'Las historias están por comenzar'}
              </h3>

              <p>
                {search
                  ? 'Prueba con otro nombre o modifica tu búsqueda.'
                  : 'Pronto descubrirás aquí a los escritores que forman parte de nuestra biblioteca.'}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                >
                  Ver todos los autores
                </button>
              )}
            </div>
          )}

          {!loading && !error && authors.length > 0 && (
            <div className="authors-grid">
              {authors.map((author) => (
                <Link
                  to={`/autores/${author.id}`}
                  className="author-card"
                  key={author.id}
                >
                  <div className="author-card-photo">
                    {author.photo_url ? (
                      <img
                        src={author.photo_url}
                        alt={author.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="author-photo-placeholder">
                        <UserRound size={55} />
                      </div>
                    )}
                  </div>

                  <div className="author-card-info">
                    <span className="author-card-label">
                      AUTOR DE LIBRIA
                    </span>

                    <h3>{author.name}</h3>

                    <p className="author-card-biography">
                      {author.biography ||
                        'Conoce más sobre este escritor y descubre sus publicaciones.'}
                    </p>

                    <div className="author-card-footer">
                      <span>
                        <BookOpen size={15} />
                        {author.total_books} {
                          Number(author.total_books) === 1
                            ? 'libro'
                            : 'libros'
                        }
                      </span>

                      <span className="author-card-link">
                        Ver perfil <Feather size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </section>
      </main>
    </PageLayout>
  );
}

export default Authors;
