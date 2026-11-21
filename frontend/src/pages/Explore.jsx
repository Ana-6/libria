
import {
    BookOpen,
    RefreshCw,
    Search,
    SlidersHorizontal
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageLayout from '../components/PageLayout';
import {
    getBookCategories,
    getBooks
} from '../services/bookService';

import './Explore.css';

function Explore() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const results = await getBookCategories();
        setCategories(results);
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };

    loadCategories();
  }, []);

  // Cargar libros y aplicar filtros
  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await getBooks({
          search,
          category,
          language,
          sort
        });

        if (!cancelled) {
          setBooks(results);
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

    const timeout = setTimeout(loadBooks, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, category, language, sort]);

  // Obtener idiomas disponibles
  const languages = useMemo(() => {
    return [
      ...new Set(
        books
          .map((book) => book.language)
          .filter(Boolean)
      )
    ].sort();
  }, [books]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLanguage('');
    setSort('newest');
  };

  return (
    <PageLayout>
      <main className="explore-page">

        {/* ENCABEZADO */}
        <section className="explore-heading">
          <span className="libria-section-label">
            EL CATÁLOGO
          </span>

          <h1 className="libria-page-title">
            Explora nuevas historias.
          </h1>

          <p className="libria-page-description">
            Descubre libros, encuentra nuevas lecturas y déjate
            llevar por historias de todos los géneros.
          </p>
        </section>

        {/* BUSCADOR */}
        <section className="explore-search">
          <Search size={21} />

          <input
            type="search"
            placeholder="Busca por título, autor o descripción..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
        </section>

        {/* FILTROS */}
        <section className="explore-toolbar">
          <div className="explore-filter-label">
            <SlidersHorizontal size={17} />
            <span>Filtrar catálogo</span>
          </div>

          <div className="explore-filters">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas las categorías</option>

              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="">Todos los idiomas</option>

              {languages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="title">Orden alfabético</option>
            </select>
          </div>
        </section>

        {/* RESULTADOS */}
        <section className="explore-results">

          <div className="explore-results-heading">
            <div>
              <h2>Biblioteca de Libria</h2>

              <p>
                {loading
                  ? 'Cargando libros...'
                  : `${books.length} ${
                      books.length === 1
                        ? 'libro disponible'
                        : 'libros disponibles'
                    }`}
              </p>
            </div>
          </div>

          {/* CARGANDO */}
          {loading && (
            <div className="explore-message">
              <RefreshCw
                className="explore-spinner"
                size={25}
              />

              <p>Cargando nuestra colección...</p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="explore-message explore-error">
              <BookOpen size={35} />

              <h3>No pudimos cargar el catálogo</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Restablecer filtros
              </button>
            </div>
          )}

          {/* SIN RESULTADOS */}
          {!loading && !error && books.length === 0 && (
            <div className="explore-message">
              <BookOpen size={35} />

              <h3>No encontramos libros</h3>

              <p>
                Prueba con otra búsqueda o selecciona una
                categoría diferente.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* CATÁLOGO DE LIBROS */}
          {!loading && !error && books.length > 0 && (
            <div className="explore-grid">

              {books.map((book) => (
                <Link
                  to={`/libro/${book.id}`}
                  className="explore-book"
                  key={book.id}
                >

                  {/* PORTADA */}
                  <div className="explore-book-cover">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`Portada de ${book.title}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="explore-no-cover">
                        <BookOpen size={38} />
                        <span>LIBRIA</span>
                      </div>
                    )}
                  </div>

                  {/* INFORMACIÓN */}
                  <div className="explore-book-info">

                    <div className="explore-book-categories">
                      {(book.categories || [])
                        .slice(0, 2)
                        .map((item) => (
                          <span key={item.id}>
                            {item.name}
                          </span>
                        ))}
                    </div>

                    <h3>{book.title}</h3>

                    <p className="explore-book-author">
                      {(book.authors || []).length > 0
                        ? book.authors
                            .map((author) => author.name)
                            .join(', ')
                        : 'Autor no especificado'}
                    </p>

                    <div className="explore-book-meta">
                      {book.publication_year && (
                        <span>{book.publication_year}</span>
                      )}

                      {book.language && (
                        <span>{book.language}</span>
                      )}
                    </div>

                    {book.description && (
                      <p className="explore-book-description">
                        {book.description}
                      </p>
                    )}

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

export default Explore;
