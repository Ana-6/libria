import {
    BookOpen,
    Bookmark,
    Clock,
    Heart,
    RefreshCw,
    Trash2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import PageLayout from '../components/PageLayout';
import {
    getLibrary,
    removeBook,
    toggleFavorite,
    updateBookStatus
} from '../services/libraryService';

import './MyLibrary.css';

const statusLabels = {
  want_to_read: 'Quiero leer',
  reading: 'Leyendo',
  completed: 'Completado',
  paused: 'En pausa'
};

function MyLibrary() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getLibrary();
      setBooks(data.books || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleStatusChange = async (bookId, status) => {
    try {
      await updateBookStatus(bookId, status);
      setBooks(current =>
        current.map(book =>
          Number(book.book_id) === Number(bookId)
            ? { ...book, reading_status: status }
            : book
        )
      );
      setMessage('Estado de lectura actualizado.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFavorite = async (bookId) => {
    try {
      const result = await toggleFavorite(bookId);
      setBooks(current =>
        current.map(book =>
          Number(book.book_id) === Number(bookId)
            ? { ...book, is_favorite: result.is_favorite }
            : book
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (bookId) => {
    if (!window.confirm('¿Quieres eliminar este libro de tu biblioteca?')) {
      return;
    }

    try {
      await removeBook(bookId);
      setBooks(current =>
        current.filter(book => Number(book.book_id) !== Number(bookId))
      );
      setMessage('Libro eliminado de tu biblioteca.');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredBooks = books.filter(book => {
    if (filter === 'favorites') return book.is_favorite;
    if (filter === 'reading') return book.reading_status === 'reading';
    if (filter === 'completed') return book.reading_status === 'completed';
    if (filter === 'pending') return book.reading_status === 'want_to_read';
    return true;
  });

  const readingCount = books.filter(book => book.reading_status === 'reading').length;
  const favoriteCount = books.filter(book => book.is_favorite).length;
  const completedCount = books.filter(book => book.reading_status === 'completed').length;

  return (
    <PageLayout>
      <main className="my-library-page">
        <section className="my-library-header">
          <span className="library-eyebrow">MI ESPACIO PERSONAL</span>
          <h1>Mi biblioteca</h1>
          <p>Todos tus libros, organizados en un solo lugar.</p>
        </section>

        <section className="library-stats">
          <article>
            <BookOpen />
            <div>
              <strong>{books.length}</strong>
              <span>Mis libros</span>
            </div>
          </article>

          <article>
            <Heart />
            <div>
              <strong>{favoriteCount}</strong>
              <span>Favoritos</span>
            </div>
          </article>

          <article>
            <Clock />
            <div>
              <strong>{readingCount}</strong>
              <span>En progreso</span>
            </div>
          </article>

          <article>
            <Bookmark />
            <div>
              <strong>{completedCount}</strong>
              <span>Completados</span>
            </div>
          </article>
        </section>

        <section className="library-content">
          <div className="library-toolbar">
            <div>
              <h2>Tu colección</h2>
              <p>Administra y organiza tus lecturas.</p>
            </div>

            <button
              className="library-refresh"
              onClick={loadLibrary}
              title="Actualizar biblioteca"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="library-filters">
            {[
              ['all', 'Todos'],
              ['reading', 'Leyendo'],
              ['pending', 'Pendientes'],
              ['completed', 'Completados'],
              ['favorites', 'Favoritos']
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {message && (
            <p className="library-message">{message}</p>
          )}

          {error && (
            <p className="library-error">{error}</p>
          )}

          {loading ? (
            <div className="library-empty">
              Cargando tu biblioteca...
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="library-empty">
              <BookOpen size={38} />
              <h3>
                {books.length === 0
                  ? 'Tu biblioteca está esperando por ti'
                  : 'No hay libros en esta sección'}
              </h3>
              <p>
                {books.length === 0
                  ? 'Cuando agregues libros desde el catálogo, aparecerán aquí.'
                  : 'Prueba seleccionando otro filtro.'}
              </p>
            </div>
          ) : (
            <div className="library-books-grid">
              {filteredBooks.map(book => (
                <article className="library-book" key={book.book_id}>
                  <div className="library-book-cover">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={`Portada de ${book.title}`} />
                    ) : (
                      <div className="library-no-cover">
                        <BookOpen size={32} />
                        <span>{book.title}</span>
                      </div>
                    )}

                    <button
                      className={`library-favorite ${book.is_favorite ? 'selected' : ''}`}
                      onClick={() => handleFavorite(book.book_id)}
                      title="Cambiar favorito"
                    >
                      <Heart size={18} fill={book.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="library-book-info">
                    <h3>{book.title}</h3>
                    <p>
                      {book.publisher || 'Editorial no especificada'}
                      {book.publication_year ? ` · ${book.publication_year}` : ''}
                    </p>

                    <label htmlFor={`status-${book.book_id}`}>
                      Estado de lectura
                    </label>

                    <select
                      id={`status-${book.book_id}`}
                      value={book.reading_status}
                      onChange={event =>
                        handleStatusChange(book.book_id, event.target.value)
                      }
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <div className="library-progress">
                      <div>
                        <span>Progreso</span>
                        <strong>{Number(book.progress || 0).toFixed(0)}%</strong>
                      </div>
                      <div className="library-progress-track">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, Number(book.progress || 0)))}%`
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className="library-remove"
                      onClick={() => handleRemove(book.book_id)}
                    >
                      <Trash2 size={15} />
                      Quitar de mi biblioteca
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </PageLayout>
  );
}

export default MyLibrary;