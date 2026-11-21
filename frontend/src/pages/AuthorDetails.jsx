import {
  ArrowLeft,
  BookOpen,
  Feather,
  RefreshCw,
  UserRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageLayout from '../components/PageLayout';
import { getAuthorById } from '../services/authorService';

import './AuthorDetails.css';

function AuthorDetails() {
  const { authorId } = useParams();

  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadAuthor = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getAuthorById(authorId);

        if (!cancelled) {
          setAuthor(result);
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

    loadAuthor();

    return () => {
      cancelled = true;
    };
  }, [authorId]);

  return (
    <PageLayout>
      <main className="author-details-page">

        <Link to="/autores" className="author-back-link">
          <ArrowLeft size={17} />
          Volver al directorio
        </Link>

        {loading && (
          <div className="author-details-message">
            <RefreshCw className="authors-spinner" size={28} />
            <p>Cargando perfil del autor...</p>
          </div>
        )}

        {!loading && error && (
          <div className="author-details-message author-details-error">
            <Feather size={38} />
            <h2>No encontramos este perfil</h2>
            <p>{error}</p>
            <Link to="/autores">Volver a autores</Link>
          </div>
        )}

        {!loading && !error && author && (
          <>
            <section className="author-profile">

              <div className="author-profile-photo">
                {author.photo_url ? (
                  <img
                    src={author.photo_url}
                    alt={author.name}
                  />
                ) : (
                  <div className="author-profile-placeholder">
                    <UserRound size={75} />
                  </div>
                )}
              </div>

              <div className="author-profile-info">
                <span className="libria-section-label">
                  AUTOR DE LIBRIA
                </span>

                <h1>{author.name}</h1>

                <div className="author-profile-count">
                  <BookOpen size={17} />
                  {author.total_books} {
                    Number(author.total_books) === 1
                      ? 'libro publicado'
                      : 'libros publicados'
                  }
                </div>

                <div className="author-profile-biography">
                  <h2>Sobre el autor</h2>

                  <p>
                    {author.biography ||
                      'Este autor todavía no ha añadido una biografía.'}
                  </p>
                </div>
              </div>

            </section>

            <section className="author-works">
              <div className="author-works-heading">
                <span className="libria-section-label">
                  SU BIBLIOTECA
                </span>

                <h2>Obras publicadas</h2>

                <p>
                  Descubre los libros disponibles de {author.name}.
                </p>
              </div>

              {(!author.books || author.books.length === 0) && (
                <div className="author-details-message">
                  <BookOpen size={35} />
                  <h3>Aún no hay obras publicadas</h3>
                  <p>
                    Las publicaciones de este autor aparecerán aquí.
                  </p>
                </div>
              )}

              {author.books && author.books.length > 0 && (
                <div className="author-books-grid">
                  {author.books.map((book) => (
                    <Link
                      to={`/libro/${book.id}`}
                      className="author-work-card"
                      key={book.id}
                    >
                      <div className="author-work-cover">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={`Portada de ${book.title}`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="author-work-no-cover">
                            <BookOpen size={35} />
                            <span>LIBRIA</span>
                          </div>
                        )}
                      </div>

                      <div className="author-work-info">
                        <h3>{book.title}</h3>

                        {book.publisher && (
                          <p>{book.publisher}</p>
                        )}

                        <div className="author-work-meta">
                          {book.publication_year && (
                            <span>{book.publication_year}</span>
                          )}

                          {book.language && (
                            <span>{book.language}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </main>
    </PageLayout>
  );
}

export default AuthorDetails;
