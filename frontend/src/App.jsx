
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Feather,
  Globe2,
  Heart,
  Library,
  Menu,
  Search,
  Sparkles,
  UserRound,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import './App.css'
import { useAuth } from './context/AuthContext'

const books = [
  {
    id: 1,
    title: 'El jardín de los secretos',
    author: 'Clara Bennett',
    category: 'Novela',
    color: 'cover-green',
    initials: 'JS',
    description: 'Una historia sobre los secretos que guardamos.'
  },
  {
    id: 2,
    title: 'Cartas a la luna',
    author: 'Isabella Moore',
    category: 'Romance',
    color: 'cover-rose',
    initials: 'CL',
    description: 'A veces las palabras encuentran su destino.'
  },
  {
    id: 3,
    title: 'La última biblioteca',
    author: 'Daniel Foster',
    category: 'Fantasía',
    color: 'cover-blue',
    initials: 'LB',
    description: 'Un lugar donde cada libro es un universo.'
  },
  {
    id: 4,
    title: 'Entre páginas',
    author: 'Sofía Laurent',
    category: 'Literatura',
    color: 'cover-cream',
    initials: 'EP',
    description: 'Pequeñas historias que dejan grandes huellas.'
  },
  {
    id: 5,
    title: 'El arte de comenzar',
    author: 'Mateo Williams',
    category: 'Desarrollo personal',
    color: 'cover-brown',
    initials: 'AC',
    description: 'Cada comienzo es una oportunidad.'
  },
  {
    id: 6,
    title: 'Donde termina el mar',
    author: 'Elena Rivers',
    category: 'Romance',
    color: 'cover-purple',
    initials: 'DM',
    description: 'Hay encuentros que cambian una vida.'
  }
]

const categories = [
  { name: 'Novela', count: 'Explora historias', icon: BookOpen },
  { name: 'Romance', count: 'Historias para sentir', icon: Heart },
  { name: 'Fantasía', count: 'Otros universos', icon: Sparkles },
  { name: 'Literatura', count: 'Grandes clásicos', icon: Feather },
  { name: 'Desarrollo personal', count: 'Crece y aprende', icon: UserRound }
]

function BookCover({ book, large = false }) {
  return (
    <div className={`book-cover ${book.color} ${large ? 'book-cover-large' : ''}`}>
      <div className="cover-top">
        <span>LIBRIA EDITIONS</span>
        <span>✦</span>
      </div>

      <div className="cover-center">
        <span className="cover-ornament">✧</span>
        <span className="cover-initials">{book.initials}</span>
        <span className="cover-ornament">✧</span>
      </div>

      <div className="cover-bottom">
        <span>{book.title}</span>
        <small>{book.author}</small>
      </div>
    </div>
  )
}

function App() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [savedBooks, setSavedBooks] = useState([])
  const { user, isAuthenticated, logout } = useAuth()

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      activeCategory === 'Todos' || book.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const toggleSaved = (id) => {
    setSavedBooks((previous) =>
      previous.includes(id)
        ? previous.filter((bookId) => bookId !== id)
        : [...previous, id]
    )
  }

  const scrollTo = (section) => {
    document.getElementById(section)?.scrollIntoView({
      behavior: 'smooth'
    })
    setMobileMenu(false)
  }

  return (
    <div className="app">
      <div className="announcement">
        <Sparkles size={13} />
        <span>Un espacio para quienes encuentran magia entre páginas.</span>
      </div>

      <header className="navbar">
        <a href="#inicio" className="brand">
          <span className="brand-icon"><BookOpen size={25} /></span>
          <span>libria<span className="brand-dot">.</span></span>
        </a>

        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'}>
  <Link to="/" onClick={() => setMobileMenu(false)}>
    Inicio
  </Link>

  <Link to="/explorar" onClick={() => setMobileMenu(false)}>
    Explorar
  </Link>

  <Link to="/categorias" onClick={() => setMobileMenu(false)}>
    Categorías
  </Link>

  <Link to="/autores" onClick={() => setMobileMenu(false)}>
    Autores
  </Link>
</nav>

        
<div className="nav-actions">
  {isAuthenticated ? (
    <>
      <Link to="/biblioteca" className="nav-login">
        Mi biblioteca
      </Link>

      <Link to="/perfil" className="nav-register">
        <UserRound size={16} />
        {user?.first_name || 'Mi perfil'}
      </Link>

      <button
        className="nav-login"
        onClick={() => {
          logout()
          setMobileMenu(false)
        }}
      >
        Cerrar sesión
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="nav-login">
        Iniciar sesión
      </Link>

      <Link to="/registro" className="nav-register">
        Crear cuenta <ArrowRight size={15} />
      </Link>
    </>
  )}
</div>


        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Abrir menú"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              TU PRÓXIMA HISTORIA COMIENZA AQUÍ
            </div>

            <h1>
              Un mundo de historias
              <br />
              <em>por descubrir.</em>
            </h1>

            <p className="hero-description">
              Hay libros que llegan a nuestras manos y terminan
              encontrando un lugar en nuestro corazón. Descubre
              tu próxima historia favorita en Libria.
            </p>

            <div className="hero-buttons">
              <button className="primary-button" onClick={() => scrollTo('explorar')}>
                Explorar biblioteca <ArrowRight size={17} />
              </button>
              <button className="text-button" onClick={() => scrollTo('categorias')}>
                Descubrir géneros <ChevronRight size={17} />
              </button>
            </div>

            <div className="hero-note">
              <span className="hero-note-icon"><BookOpen size={17} /></span>
              <span>Un universo de lecturas te espera.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-decoration decoration-one" />
            <div className="hero-decoration decoration-two" />

            <div className="hero-book hero-book-back">
              <BookCover book={books[1]} large />
            </div>

            <div className="hero-book hero-book-front">
              <BookCover book={books[0]} large />
            </div>

            <div className="floating-note">
              <span className="floating-star">✦</span>
              <div>
                <strong>Una historia nueva</strong>
                <small>Un mundo por explorar</small>
              </div>
            </div>

            <span className="hero-visual-caption">LECTURA · INSPIRACIÓN · DESCUBRIMIENTO</span>
          </div>
        </section>

        <section className="intro-strip">
          <div className="intro-item">
            <BookOpen size={21} />
            <div>
              <strong>Descubre</strong>
              <span>Historias extraordinarias</span>
            </div>
          </div>
          <div className="intro-divider" />
          <div className="intro-item">
            <Bookmark size={21} />
            <div>
              <strong>Colecciona</strong>
              <span>Tus lecturas favoritas</span>
            </div>
          </div>
          <div className="intro-divider" />
          <div className="intro-item">
            <Feather size={21} />
            <div>
              <strong>Comparte</strong>
              <span>Tu pasión por los libros</span>
            </div>
          </div>
        </section>

        <section className="featured-section section-container" id="explorar">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">UNA SELECCIÓN PARA TI</span>
              <h2>Historias que <em>inspiran.</em></h2>
              <p>Explora títulos que podrían convertirse en tus próximos favoritos.</p>
            </div>
            <button className="view-all" onClick={() => {
              setActiveCategory('Todos')
              setSearch('')
            }}>
              Ver colección <ArrowRight size={16} />
            </button>
          </div>

          <div className="search-box">
            <Search size={19} />
            <input
              type="text"
              placeholder="Busca un libro o autor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
                <X size={17} />
              </button>
            )}
          </div>

          <div className="category-filters">
            {['Todos', 'Novela', 'Romance', 'Fantasía', 'Literatura', 'Desarrollo personal'].map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'filter-active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="books-grid">
            {filteredBooks.map((book) => (
              <article className="book-card" key={book.id}>
                <div className="book-card-visual">
                  <BookCover book={book} />
                  <button
                    className={`save-button ${savedBooks.includes(book.id) ? 'saved' : ''}`}
                    onClick={() => toggleSaved(book.id)}
                    aria-label="Guardar libro"
                  >
                    <Bookmark size={17} fill={savedBooks.includes(book.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="book-info">
                  <span className="book-category">{book.category}</span>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                </div>
              </article>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="empty-results">
              <BookOpen size={30} />
              <h3>No encontramos ese libro</h3>
              <p>Prueba con otro título, autor o categoría.</p>
            </div>
          )}

          <div className="collection-footer">
            <span>Una pequeña muestra de todo lo que puedes descubrir.</span>
            <span>{savedBooks.length} {savedBooks.length === 1 ? 'libro guardado' : 'libros guardados'}</span>
          </div>
        </section>

        <section className="categories-section" id="categorias">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">ENCUENTRA TU PRÓXIMA AVENTURA</span>
                <h2>Un género para cada <em>momento.</em></h2>
                <p>Sea cual sea tu estado de ánimo, hay una historia esperándote.</p>
              </div>
            </div>

            <div className="categories-grid">
              {categories.map((category, index) => {
                const Icon = category.icon
                return (
                  <button
                    className="category-card"
                    key={category.name}
                    onClick={() => {
                      setActiveCategory(category.name)
                      scrollTo('explorar')
                    }}
                  >
                    <span className="category-number">0{index + 1}</span>
                    <span className="category-icon"><Icon size={24} /></span>
                    <strong>{category.name}</strong>
                    <span className="category-description">{category.count}</span>
                    <span className="category-arrow"><ArrowRight size={17} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="authors-section section-container" id="autores">
          <div className="authors-content">
            <span className="section-eyebrow">DETRÁS DE CADA HISTORIA</span>
            <h2>Las palabras también merecen un <em>hogar.</em></h2>
            <p>
              Libria es también un espacio para quienes crean historias.
              Queremos dar visibilidad a nuevos talentos y acercar sus
              obras a lectores que buscan algo diferente.
            </p>
            <button className="primary-button" onClick={() => window.alert('Próximamente podrás descubrir cómo publicar en Libria.')}>
              Descubrir autores <ArrowRight size={17} />
            </button>
          </div>
          <div className="authors-art">
            <div className="author-art-circle">
              <Feather size={76} strokeWidth={0.9} />
              <span>Las historias<br />nos conectan.</span>
            </div>
            <span className="author-art-star star-a">✧</span>
            <span className="author-art-star star-b">✦</span>
          </div>
        </section>

        <section className="community-section">
          <div className="community-inner">
            <span className="section-eyebrow">BIENVENIDO A LIBRIA</span>
            <h2>Tu próxima historia<br /><em>está por comenzar.</em></h2>
            <p>Descubre, guarda y comparte el placer de leer.</p>
            <Link to="/registro" className="community-button">
  Forma parte de Libria <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#inicio" className="brand">
              <span className="brand-icon"><BookOpen size={24} /></span>
              <span>libria<span className="brand-dot">.</span></span>
            </a>
            <p>Un espacio donde cada página<br />abre la puerta a un nuevo mundo.</p>
          </div>

          <div className="footer-column">
            <strong>Explorar</strong>
            <a href="#explorar">Biblioteca</a>
            <a href="#categorias">Categorías</a>
            <a href="#autores">Autores</a>
          </div>

          <div className="footer-column">
            <strong>Comunidad</strong>
            <a href="#autores">Publicar un libro</a>
            <a href="#inicio">Sobre Libria</a>
            <a href="#inicio">Contacto</a>
          </div>

          <div className="footer-column">
            <strong>Un mundo abierto</strong>
            <span><Globe2 size={15} /> Para lectores de todas partes</span>
            <span><Library size={15} /> Una biblioteca por descubrir</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Libria. Todos los derechos reservados.</span>
          <span>Hecho para quienes aman las historias. <span className="footer-heart">♥</span></span>
        </div>
      </footer>
    </div>
  )
}

export default App
