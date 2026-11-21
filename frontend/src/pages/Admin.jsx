
import {
    AlertCircle,
    BookOpen,
    Check,
    ChevronRight,
    FileText,
    LayoutDashboard,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Tags,
    Trash2,
    UserRound,
    Users,
    X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import PageLayout from '../components/PageLayout';
import * as admin from '../services/adminService';
import './Admin.css';

const sections = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'books', label: 'Libros', icon: BookOpen },
  { id: 'authors', label: 'Autores', icon: UserRound },
  { id: 'categories', label: 'Categorías', icon: Tags },
  { id: 'chapters', label: 'Capítulos', icon: FileText },
  { id: 'users', label: 'Usuarios', icon: Users }
];

const emptyBook = {
  title: '', description: '', isbn: '', cover_url: '',
  publisher: '', publication_year: '', language: 'Español',
  publication_status: 'draft', content_source: 'original',
  rights_status: 'pending', author_ids: [], category_ids: []
};

const emptyAuthor = { name: '', biography: '', photo_url: '' };
const emptyCategory = { name: '', slug: '', description: '' };
const emptyChapter = { chapter_number: 1, title: '', content: '' };

function Admin() {
  const [section, setSection] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [users, setUsers] = useState([]);

  const [options, setOptions] = useState({ authors: [], categories: [] });
  const [selectedBook, setSelectedBook] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingBook, setUploadingBook] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (section === 'dashboard') {
        const result = await admin.getDashboard();
        setDashboard(result.dashboard);
      }

      if (section === 'books') {
        const [bookResult, optionResult] = await Promise.all([
          admin.getAdminBooks({ search, status: statusFilter }),
          admin.getAdminOptions()
        ]);
        setBooks(bookResult.books || []);
        setOptions(optionResult);
      }

      if (section === 'authors') {
        const result = await admin.getAdminAuthors();
        setAuthors(result.authors || []);
      }

      if (section === 'categories') {
        const result = await admin.getAdminCategories();
        setCategories(result.categories || []);
      }

      if (section === 'chapters') {
        const bookResult = await admin.getAdminBooks();
        setBooks(bookResult.books || []);
      
        if (selectedBook) {
          const result = await admin.getAdminChapters(selectedBook);
          setChapters(result.chapters || []);
        } else {
          setChapters([]);
        }
      }

      if (section === 'users') {
        const result = await admin.getAdminUsers();
        setUsers(result.users || []);
      }
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [section, search, statusFilter, selectedBook]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notify = (message) => {
    setNotice(message);
    setError('');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openForm = (type, item = null) => {
    setEditing(item ? item.id : 'new');

    if (type === 'books') {
      setForm(item ? {
        ...item,
        publication_year: item.publication_year || '',
        author_ids: (item.authors || []).map((a) => String(a.id)),
        category_ids: (item.categories || []).map((c) => String(c.id))
      } : { ...emptyBook });
    }

    if (type === 'authors') {
      setForm(item ? {
        name: item.name || '',
        biography: item.biography || '',
        photo_url: item.photo_url || ''
      } : { ...emptyAuthor });
    }

    if (type === 'categories') {
      setForm(item ? {
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || ''
      } : { ...emptyCategory });
    }

    if (type === 'chapters') {
      setForm(item ? {
        chapter_number: item.chapter_number,
        title: item.title || '',
        content: item.content || ''
      } : { ...emptyChapter });
    }
  };

  const closeForm = () => {
    setEditing(null);
    setForm({});
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (section === 'books') {
        const payload = {
          ...form,
          publication_year: form.publication_year
            ? Number(form.publication_year) : null
        };

        if (editing === 'new') {
          await admin.createBook(payload);
          notify('Libro creado correctamente.');
        } else {
          await admin.updateBook(editing, payload);
          notify('Libro actualizado correctamente.');
        }
      }

      if (section === 'authors') {
        if (editing === 'new') {
          await admin.createAuthor(form);
          notify('Autor creado correctamente.');
        } else {
          await admin.updateAuthor(editing, form);
          notify('Autor actualizado correctamente.');
        }
      }

      if (section === 'categories') {
        if (editing === 'new') {
          await admin.createCategory(form);
          notify('Categoría creada correctamente.');
        } else {
          await admin.updateCategory(editing, form);
          notify('Categoría actualizada correctamente.');
        }
      }

      if (section === 'chapters') {
        if (!selectedBook) throw new Error('Selecciona un libro.');

        const payload = {
          ...form,
          chapter_number: Number(form.chapter_number)
        };

        if (editing === 'new') {
          await admin.createChapter(selectedBook, payload);
          notify('Capítulo creado correctamente.');
        } else {
          await admin.updateChapter(editing, payload);
          notify('Capítulo actualizado correctamente.');
        }
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la información.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      if (type === 'books') await admin.deleteBook(id);
      if (type === 'authors') await admin.deleteAuthor(id);
      if (type === 'categories') await admin.deleteCategory(id);
      if (type === 'chapters') await admin.deleteChapter(id);

      notify('Registro eliminado correctamente.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeBookStatus = async (book, publication_status) => {
    if (
        publication_status === 'approved' &&
        !['verified', 'not_required'].includes(book.rights_status)
      ) {
        setError('No puedes aprobar este libro hasta verificar sus derechos de publicación.');
        return;
      }
    
    try {
      await admin.updateBookStatus(book.id, publication_status);
      notify('Estado del libro actualizado.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadFile = async (bookId, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingBook(String(bookId));
    setError('');

    try {
      const result = await admin.uploadBookFile(bookId, file);
      notify(result.message || 'Archivo cargado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo cargar el archivo.');
    } finally {
      setUploadingBook(null);
      event.target.value = '';
    }
  };

  const changeUser = async (user, changes) => {
    try {
      await admin.updateUser(user.id, {
        role: changes.role ?? user.role,
        is_active: changes.is_active ?? user.is_active
      });
      notify('Usuario actualizado.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const field = (name, value) => (
    <input
      value={value ?? ''}
      onChange={(e) => setForm((old) => ({ ...old, [name]: e.target.value }))}
    />
  );

  const textarea = (name, value, rows = 4) => (
    <textarea
      rows={rows}
      value={value ?? ''}
      onChange={(e) => setForm((old) => ({ ...old, [name]: e.target.value }))}
    />
  );

  const select = (name, value, choices) => (
    <select
      value={value ?? ''}
      onChange={(e) => setForm((old) => ({ ...old, [name]: e.target.value }))}
    >
      {choices.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );

  const renderBookForm = () => (
    <>
      <label>Título *</label>
      {field('title', form.title)}

      <label>Descripción</label>
      {textarea('description', form.description)}

      <div className="admin-form-grid">
        <div><label>ISBN</label>{field('isbn', form.isbn)}</div>
        <div><label>Editorial</label>{field('publisher', form.publisher)}</div>
        <div><label>Año de publicación</label>{field('publication_year', form.publication_year)}</div>
        <div><label>Idioma</label>{field('language', form.language)}</div>
        <div className="admin-full"><label>URL de portada</label>{field('cover_url', form.cover_url)}</div>
        <div>
          <label>Estado de publicación</label>
          {select('publication_status', form.publication_status, [
            ['draft', 'Borrador'],
            ['pending_review', 'Pendiente de revisión'],
            ['approved', 'Aprobado'],
            ['rejected', 'Rechazado']
          ])}
        </div>
        <div>
          <label>Origen del contenido</label>
          {select('content_source', form.content_source, [
            ['original', 'Original'],
            ['authorized', 'Autorizado'],
            ['public_domain', 'Dominio público']
          ])}
        </div>
        <div>
          <label>Derechos</label>
          {select('rights_status', form.rights_status, [
            ['pending', 'Pendientes'],
            ['verified', 'Verificados'],
            ['rejected', 'Rechazados'],
            ['not_required', 'No requeridos']
          ])}
        </div>
      </div>

      <label>Autores</label>
      <select
        multiple
        className="admin-multi-select"
        value={form.author_ids || []}
        onChange={(e) => setForm((old) => ({
          ...old,
          author_ids: Array.from(e.target.selectedOptions, (o) => o.value)
        }))}
      >
        {options.authors.map((a) => (
          <option key={a.id} value={String(a.id)}>{a.name}</option>
        ))}
      </select>

      <label>Categorías</label>
      <select
        multiple
        className="admin-multi-select"
        value={form.category_ids || []}
        onChange={(e) => setForm((old) => ({
          ...old,
          category_ids: Array.from(e.target.selectedOptions, (o) => o.value)
        }))}
      >
        {options.categories.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </select>
      <small>Mantén presionada la tecla Ctrl o Command para seleccionar varias opciones.</small>
    </>
  );

  const renderForm = () => {
    if (!editing) return null;

    return (
      <div className="admin-modal-backdrop">
        <form className="admin-modal" onSubmit={handleSave}>
          <div className="admin-modal-heading">
            <h2>
              {editing === 'new' ? 'Crear' : 'Editar'} {
                section === 'books' ? 'libro' :
                section === 'authors' ? 'autor' :
                section === 'categories' ? 'categoría' : 'capítulo'
              }
            </h2>
            <button type="button" className="admin-icon-button" onClick={closeForm}>
              <X size={20} />
            </button>
          </div>

          {section === 'books' && renderBookForm()}

          {section === 'authors' && (
            <>
              <label>Nombre *</label>
              {field('name', form.name)}
              <label>Biografía</label>
              {textarea('biography', form.biography)}
              <label>URL de fotografía</label>
              {field('photo_url', form.photo_url)}
            </>
          )}

          {section === 'categories' && (
            <>
              <label>Nombre *</label>
              {field('name', form.name)}
              <label>Slug (opcional)</label>
              {field('slug', form.slug)}
              <label>Descripción</label>
              {textarea('description', form.description)}
            </>
          )}

          {section === 'chapters' && (
            <>
              <label>Número de capítulo *</label>
              {field('chapter_number', form.chapter_number)}
              <label>Título *</label>
              {field('title', form.title)}
              <label>Contenido</label>
              {textarea('content', form.content, 12)}
            </>
          )}

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="button" className="admin-button secondary" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit" className="admin-button primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="admin-welcome">
        <div>
          <span className="admin-eyebrow">CENTRO DE CONTROL</span>
          <h1>Administración de Libria</h1>
          <p>Gestiona el catálogo, las publicaciones y la comunidad.</p>
        </div>
        <ShieldCheck size={42} />
      </div>

      {dashboard && (
        <div className="admin-stats">
          {[
            ['Libros', dashboard.books?.total ?? 0, BookOpen],
            ['Aprobados', dashboard.books?.approved ?? 0, Check],
            ['Pendientes', dashboard.books?.pending ?? 0, FileText],
            ['Usuarios', dashboard.users ?? 0, Users],
            ['Autores', dashboard.authors ?? 0, UserRound],
            ['Categorías', dashboard.categories ?? 0, Tags]
          ].map(([label, value, Icon]) => (
            <div className="admin-stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <Icon size={21} />
            </div>
          ))}
        </div>
      )}

      <div className="admin-section-heading">
        <div>
          <h2>Accesos rápidos</h2>
          <p>Entra directamente a cada área de administración.</p>
        </div>
      </div>

      <div className="admin-quick-grid">
        {sections.filter((s) => s.id !== 'dashboard').map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className="admin-quick-card" onClick={() => setSection(item.id)}>
              <Icon size={23} />
              <span>{item.label}</span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
    </>
  );

  const renderBooks = () => (
    <>
      <div className="admin-section-heading">
        <div><h1>Libros</h1><p>Administra el catálogo y revisa las publicaciones.</p></div>
        <button className="admin-button primary" onClick={() => openForm('books')}>
          <Plus size={17} /> Nuevo libro
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input placeholder="Buscar libros..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="draft">Borradores</option>
          <option value="pending_review">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Libro</th><th>Estado</th><th>Derechos</th><th>Acciones</th></tr></thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <strong>{book.title}</strong>
                  <small>{(book.authors || []).map((a) => a.name).join(', ') || 'Sin autor asignado'}</small>
                </td>
                <td>
                  <span className={`admin-status ${book.publication_status}`}>
                    {book.publication_status}
                  </span>
                </td>
                <td>{book.rights_status}</td>
                <td className="admin-actions">
                  <button title="Editar" onClick={() => openForm('books', book)}><Pencil size={17} /></button>
                  {book.publication_status !== 'approved' && (
                    <button title="Aprobar" onClick={() => changeBookStatus(book, 'approved')}><Check size={17} /></button>
                  )}
                  {book.publication_status !== 'rejected' && (
                    <button title="Rechazar" onClick={() => changeBookStatus(book, 'rejected')}><X size={17} /></button>
                  )}
                  <label
                    htmlFor={`upload-book-${book.id}`}
                    className="admin-button secondary"
                    title="Seleccionar PDF o EPUB"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: uploadingBook === String(book.id) ? 'wait' : 'pointer'
                    }}
                  >
                    <FileText size={16} />
                    {uploadingBook === String(book.id) ? 'Subiendo...' : 'Subir PDF/EPUB'}
                    <input
                      id={`upload-book-${book.id}`}
                      type="file"
                      accept=".pdf,.epub,application/pdf,application/epub+zip"
                      aria-label={`Subir PDF o EPUB para ${book.title}`}
                      disabled={uploadingBook === String(book.id)}
                      onChange={(event) => handleUploadFile(book.id, event)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button title="Eliminar" onClick={() => handleDelete('books', book.id)}><Trash2 size={17} /></button>
                </td>
              </tr>
            ))}
            {!books.length && <tr><td colSpan="4">No hay libros para mostrar.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderAuthors = () => (
    <>
      <div className="admin-section-heading">
        <div><h1>Autores</h1><p>Administra los perfiles de autores de Libria.</p></div>
        <button className="admin-button primary" onClick={() => openForm('authors')}><Plus size={17} /> Nuevo autor</button>
      </div>
      <div className="admin-card-list">
        {authors.map((author) => (
          <div className="admin-item-card" key={author.id}>
            <div><strong>{author.name}</strong><small>{author.books_count} libros asociados</small></div>
            <div className="admin-actions">
              <button onClick={() => openForm('authors', author)}><Pencil size={17} /></button>
              <button onClick={() => handleDelete('authors', author.id)}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
        {!authors.length && <p>No hay autores registrados.</p>}
      </div>
    </>
  );

  const renderCategories = () => (
    <>
      <div className="admin-section-heading">
        <div><h1>Categorías</h1><p>Organiza los géneros y temas del catálogo.</p></div>
        <button className="admin-button primary" onClick={() => openForm('categories')}><Plus size={17} /> Nueva categoría</button>
      </div>
      <div className="admin-card-list">
        {categories.map((category) => (
          <div className="admin-item-card" key={category.id}>
            <div><strong>{category.name}</strong><small>/{category.slug} · {category.books_count} libros</small></div>
            <div className="admin-actions">
              <button onClick={() => openForm('categories', category)}><Pencil size={17} /></button>
              <button onClick={() => handleDelete('categories', category.id)}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
        {!categories.length && <p>No hay categorías registradas.</p>}
      </div>
    </>
  );

  const renderChapters = () => (
    <>
      <div className="admin-section-heading">
        <div><h1>Capítulos</h1><p>Administra el contenido de los libros.</p></div>
      </div>
      <div className="admin-toolbar">
        <label>Selecciona un libro</label>
        <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}>
          <option value="">Seleccionar libro...</option>
          {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
        </select>
        {selectedBook && (
          <button className="admin-button primary" onClick={() => openForm('chapters')}>
            <Plus size={17} /> Nuevo capítulo
          </button>
        )}
      </div>
      {selectedBook && (
        <div className="admin-card-list">
          {chapters.map((chapter) => (
            <div className="admin-item-card" key={chapter.id}>
              <div>
                <strong>Capítulo {chapter.chapter_number}: {chapter.title}</strong>
                <small>{chapter.status || 'Sin estado'}</small>
              </div>
              <div className="admin-actions">
                <button onClick={() => openForm('chapters', chapter)}><Pencil size={17} /></button>
                <button onClick={() => handleDelete('chapters', chapter.id)}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
          {!chapters.length && <p>Este libro todavía no tiene capítulos.</p>}
        </div>
      )}
    </>
  );

  const renderUsers = () => (
    <>
      <div className="admin-section-heading">
        <div><h1>Usuarios</h1><p>Consulta cuentas y administra sus permisos.</p></div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.first_name} {user.last_name}</strong><small>{user.email}</small></td>
                <td>
                  <select value={user.role} onChange={(e) => changeUser(user, { role: e.target.value })}>
                    <option value="user">Usuario</option>
                    <option value="author">Autor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td><span className={`admin-status ${user.is_active ? 'approved' : 'rejected'}`}>
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </span></td>
                <td>
                  <button
                    className="admin-button secondary"
                    onClick={() => changeUser(user, { is_active: !user.is_active })}
                  >
                    {user.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan="4">No hay usuarios registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderSection = () => {
    if (section === 'dashboard') return renderDashboard();
    if (section === 'books') return renderBooks();
    if (section === 'authors') return renderAuthors();
    if (section === 'categories') return renderCategories();
    if (section === 'chapters') return renderChapters();
    if (section === 'users') return renderUsers();
    return null;
  };

  return (
    <PageLayout>
      <main className="admin-page">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title"><ShieldCheck size={20} /> Administración</div>
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={section === item.id ? 'active' : ''}
                onClick={() => {
                  setSection(item.id);
                  closeForm();
                  setError('');
                }}
              >
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </aside>

        <section className="admin-content">
          <div className="admin-topbar">
            <span>LIBRIA / ADMINISTRACIÓN</span>
            <button onClick={loadData} title="Actualizar"><RefreshCw size={17} /></button>
          </div>

          {notice && <div className="admin-notice"><Check size={17} /> {notice}</div>}
          {error && !editing && <div className="admin-error"><AlertCircle size={17} /> {error}</div>}
          {loading ? <div className="admin-loading">Cargando información...</div> : renderSection()}
        </section>
      </main>
      {renderForm()}
    </PageLayout>
  );
}

export default Admin;
