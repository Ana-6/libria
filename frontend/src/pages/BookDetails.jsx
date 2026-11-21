
import {
    ArrowLeft,
    BookOpen,
    BookmarkPlus,
    Check,
    LoaderCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageLayout from '../components/PageLayout';
import { getToken } from '../services/authService';
import { getBookById } from '../services/bookService';
import { addBook } from '../services/libraryService';
import './BookDetails.css';

function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true);
        const result = await getBookById(bookId);
        setBook(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  const handleAddBook = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    try {
      setAdding(true);
      await addBook(book.id);
      setAdded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="book-details-message">
          <LoaderCircle className="book-details-spinner" size={30} />
          <p>Cargando información del libro...</p>
        </div>
      </PageLayout>
    );
  }

  if (error && !book) {
    return (
      <PageLayout>
        <div className="book-details-message">
          <BookOpen size={35} />
          <h2>No pudimos encontrar el libro</h2>
          <p>{error}</p>
          <Link to="/explorar">Volver al catálogo</Link>
        </div>
      </PageLayout>
    );
  }

  if (!book) return null;

  return (
    <PageLayout>
      <main className="book-details-page">
        <Link to="/explorar" className="book-details-back">
          <ArrowLeft size={17} />
          Volver al catálogo
        </Link>

        <section className="book-details-layout">
          <div className="book-details-cover">
            {book.cover_url ? (
              <img src={book.cover_url} alt={`Portada de ${book.title}`} />
            ) : (
              <div className="book-details-no-cover">
                <BookOpen size={55} />
                <span>LIBRIA</span>
              </div>
            )}
          </div>

          <div className="book-details-content">
            <div className="book-details-categories">
              {(book.categories || []).map((item) => (
                <span key={item.id}>{item.name}</span>
              ))}
            </div>

            <span className="libria-section-label">DESCUBRE ESTA HISTORIA</span>

            <h1>{book.title}</h1>

            <p className="book-details-authors">
              {book.authors?.length
                ? book.authors.map((author) => author.name).join(', ')
                : 'Autor no especificado'}
            </p>

            <div className="book-details-meta">
              {book.publication_year && (
                <div>
                  <span>Año de publicación</span>
                  <strong>{book.publication_year}</strong>
                </div>
              )}

              {book.publisher && (
                <div>
                  <span>Editorial</span>
                  <strong>{book.publisher}</strong>
                </div>
              )}

              {book.language && (
                <div>
                  <span>Idioma</span>
                  <strong>{book.language}</strong>
                </div>
              )}

              {book.chapter_count > 0 && (
                <div>
                  <span>Capítulos disponibles</span>
                  <strong>{book.chapter_count}</strong>
                </div>
              )}
            </div>

            <div className="book-details-description">
              <h2>Acerca de este libro</h2>
              <p>
                {book.description || 'Todavía no hay una descripción disponible.'}
              </p>
            </div>

            <button
              className={`book-details-add ${added ? 'is-added' : ''}`}
              onClick={handleAddBook}
              disabled={adding || added}
            >
              {adding ? (
                <LoaderCircle size={19} className="book-details-spinner" />
              ) : added ? (
                <Check size={19} />
              ) : (
                <BookmarkPlus size={19} />
              )}

              {adding
                ? 'Agregando...'
                : added
                  ? 'Añadido a mi biblioteca'
                  : 'Añadir a mi biblioteca'}
            </button>

            <Link
  to={getToken() ? `/leer/${book.id}` : '/login'}
  className="book-details-add"
>
  <BookOpen size={19} />
  Leer libro
</Link>

            {error && (
              <p className="book-details-error">{error}</p>
            )}

            

            <p className="book-details-note">
              Guarda este libro en tu biblioteca personal para seguir
              tu recorrido de lectura.
            </p>
          </div>
        </section>
      </main>
    </PageLayout>
  );
}

export default BookDetails;
