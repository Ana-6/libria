
import pool from '../config/database.js';

const publicationStatuses = [
  'draft',
  'pending_review',
  'approved',
  'rejected'
];

const contentSources = [
  'original',
  'authorized',
  'public_domain'
];

const rightsStatuses = [
  'pending',
  'verified',
  'rejected',
  'not_required'
];

const isValidId = (id) => /^\d+$/.test(String(id));

const getBookRelations = async (client, bookId, authorIds = [], categoryIds = []) => {
  await client.query(
    'DELETE FROM book_authors WHERE book_id = $1',
    [bookId]
  );

  await client.query(
    'DELETE FROM book_categories WHERE book_id = $1',
    [bookId]
  );

  for (const authorId of authorIds) {
    await client.query(
      `INSERT INTO book_authors (book_id, author_id)
       VALUES ($1, $2)`,
      [bookId, authorId]
    );
  }

  for (const categoryId of categoryIds) {
    await client.query(
      `INSERT INTO book_categories (book_id, category_id)
       VALUES ($1, $2)`,
      [bookId, categoryId]
    );
  }
};

// ==========================================
// ESTADÍSTICAS DEL PANEL
// ==========================================

export const getDashboard = async (req, res) => {
  try {
    const [books, users, authors, categories] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE publication_status = 'approved'
          )::int AS approved,
          COUNT(*) FILTER (
            WHERE publication_status = 'pending_review'
          )::int AS pending,
          COUNT(*) FILTER (
            WHERE publication_status = 'draft'
          )::int AS drafts,
          COUNT(*) FILTER (
            WHERE publication_status = 'rejected'
          )::int AS rejected
        FROM books
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM users
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM authors
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total
        FROM categories
      `)
    ]);

    return res.json({
      success: true,
      dashboard: {
        books: books.rows[0],
        users: users.rows[0].total,
        authors: authors.rows[0].total,
        categories: categories.rows[0].total
      }
    });
  } catch (error) {
    console.error('Error en estadísticas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener las estadísticas.'
    });
  }
};

// ==========================================
// LISTAR TODOS LOS LIBROS
// ==========================================

export const getAdminBooks = async (req, res) => {
  try {
    const { status, search } = req.query;

    const values = [];
    const conditions = [];

    if (status && publicationStatuses.includes(status)) {
      values.push(status);
      conditions.push(`b.publication_status = $${values.length}`);
    }

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(
        b.title ILIKE $${values.length}
        OR b.description ILIKE $${values.length}
      )`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await pool.query(`
      SELECT
        b.*,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object('id', a.id, 'name', a.name)
          )
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author_id
          WHERE ba.book_id = b.id
        ), '[]'::jsonb) AS authors,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object('id', c.id, 'name', c.name)
          )
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category_id
          WHERE bc.book_id = b.id
        ), '[]'::jsonb) AS categories
      FROM books b
      ${where}
      ORDER BY b.created_at DESC
      LIMIT 200
    `, values);

    return res.json({
      success: true,
      total: result.rows.length,
      books: result.rows
    });
  } catch (error) {
    console.error('Error listando libros:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los libros.'
    });
  }
};

// ==========================================
// OBTENER AUTORES Y CATEGORÍAS PARA FORMULARIOS
// ==========================================

export const getAdminOptions = async (req, res) => {
  try {
    const [authors, categories] = await Promise.all([
      pool.query(`
        SELECT id, name
        FROM authors
        ORDER BY name ASC
      `),
      pool.query(`
        SELECT id, name, slug
        FROM categories
        ORDER BY name ASC
      `)
    ]);

    return res.json({
      success: true,
      authors: authors.rows,
      categories: categories.rows
    });
  } catch (error) {
    console.error('Error obteniendo opciones:', error.message);
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener autores y categorías.'
    });
  }
};

// ==========================================
// CREAR LIBRO
// ==========================================

export const createBook = async (req, res) => {
  const {
    title,
    description,
    isbn,
    cover_url,
    publisher,
    publication_year,
    language,
    publication_status = 'draft',
    content_source = 'original',
    rights_status = 'pending',
    author_ids = [],
    category_ids = []
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El título del libro es obligatorio.'
    });
  }

  if (!publicationStatuses.includes(publication_status) ||
      !contentSources.includes(content_source) ||
      !rightsStatuses.includes(rights_status)) {
    return res.status(400).json({
      success: false,
      message: 'Uno o más estados o valores de publicación no son válidos.'
    });
  }

  if (!Array.isArray(author_ids) || !Array.isArray(category_ids)) {
    return res.status(400).json({
      success: false,
      message: 'Autores y categorías deben enviarse como listas.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO books (
        title,
        description,
        isbn,
        cover_url,
        publisher,
        publication_year,
        language,
        publication_status,
        content_source,
        rights_status,
        submitted_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [
      title.trim(),
      description || null,
      isbn || null,
      cover_url || null,
      publisher || null,
      publication_year || null,
      language || null,
      publication_status,
      content_source,
      rights_status,
      req.user.id
    ]);

    const book = result.rows[0];

    await getBookRelations(
      client,
      book.id,
      author_ids,
      category_ids
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Libro creado correctamente.',
      book
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando libro:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo crear el libro. Verifica autores, categorías y datos.'
    });
  } finally {
    client.release();
  }
};

// ==========================================
// ACTUALIZAR LIBRO
// ==========================================

export const updateBook = async (req, res) => {
  const { bookId } = req.params;

  if (!isValidId(bookId)) {
    return res.status(400).json({
      success: false,
      message: 'Identificador de libro no válido.'
    });
  }

  const {
    title,
    description,
    isbn,
    cover_url,
    publisher,
    publication_year,
    language,
    publication_status,
    content_source,
    rights_status,
    author_ids,
    category_ids
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El título del libro es obligatorio.'
    });
  }

  if (
    !publicationStatuses.includes(publication_status) ||
    !contentSources.includes(content_source) ||
    !rightsStatuses.includes(rights_status)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Los valores de publicación no son válidos.'
    });
  }

  if (
    !Array.isArray(author_ids) ||
    !Array.isArray(category_ids)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Debes enviar las listas de autores y categorías.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE books
      SET
        title = $1,
        description = $2,
        isbn = $3,
        cover_url = $4,
        publisher = $5,
        publication_year = $6,
        language = $7,
        publication_status = $8,
        content_source = $9,
        rights_status = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      title.trim(),
      description || null,
      isbn || null,
      cover_url || null,
      publisher || null,
      publication_year || null,
      language || null,
      publication_status,
      content_source,
      rights_status,
      bookId
    ]);

    if (!result.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado.'
      });
    }

    await getBookRelations(
      client,
      bookId,
      author_ids,
      category_ids
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Libro actualizado correctamente.',
      book: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando libro:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el libro.'
    });
  } finally {
    client.release();
  }
};

// ==========================================
// APROBAR O CAMBIAR ESTADO DE PUBLICACIÓN
// ==========================================


export const updateBookStatus = async (req, res) => {
    const { bookId } = req.params;
    const { publication_status } = req.body;
  
    if (!isValidId(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de libro no válido.'
      });
    }
  
    if (!publicationStatuses.includes(publication_status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de publicación no válido.'
      });
    }
  
    try {
      const bookResult = await pool.query(
        'SELECT id, title, rights_status FROM books WHERE id = $1',
        [bookId]
      );
  
      if (!bookResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Libro no encontrado.'
        });
      }
  
      const book = bookResult.rows[0];
  
      if (
        publication_status === 'approved' &&
        !['verified', 'not_required'].includes(book.rights_status)
      ) {
        return res.status(409).json({
          success: false,
          message: 'Debes verificar los derechos de publicación antes de aprobar este libro.'
        });
      }
  
      const result = await pool.query(`
        UPDATE books
        SET publication_status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, title, publication_status
      `, [publication_status, bookId]);
  
      return res.json({
        success: true,
        message: 'Estado de publicación actualizado.',
        book: result.rows[0]
      });
    } catch (error) {
      console.error('Error cambiando estado:', error.message);
      return res.status(500).json({
        success: false,
        message: 'No se pudo actualizar el estado.'
      });
    }
  };
  

// ==========================================
// UTILIDAD PARA GENERAR SLUGS
// ==========================================

const createSlug = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  
  
  // ==========================================
  // GESTIÓN DE AUTORES
  // ==========================================
  
  export const getAdminAuthors = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          a.*,
          COUNT(ba.book_id)::int AS books_count
        FROM authors a
        LEFT JOIN book_authors ba ON ba.author_id = a.id
        GROUP BY a.id
        ORDER BY a.name ASC
      `);
  
      res.json({ success: true, authors: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error obteniendo autores.' });
    }
  };
  
  export const createAuthor = async (req, res) => {
    const { name, biography, photo_url } = req.body;
  
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
    }
  
    try {
      const result = await pool.query(`
        INSERT INTO authors (name, biography, photo_url)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name.trim(), biography || null, photo_url || null]);
  
      res.status(201).json({
        success: true,
        message: 'Autor creado correctamente.',
        author: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'No se pudo crear el autor.' });
    }
  };
  
  export const updateAuthor = async (req, res) => {
    const { authorId } = req.params;
    const { name, biography, photo_url } = req.body;
  
    if (!isValidId(authorId) || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Datos del autor no válidos.' });
    }
  
    try {
      const result = await pool.query(`
        UPDATE authors
        SET name = $1,
            biography = $2,
            photo_url = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [name.trim(), biography || null, photo_url || null, authorId]);
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Autor no encontrado.' });
      }
  
      res.json({ success: true, message: 'Autor actualizado.', author: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'No se pudo actualizar el autor.' });
    }
  };
  
  export const deleteAuthor = async (req, res) => {
    const { authorId } = req.params;
  
    if (!isValidId(authorId)) {
      return res.status(400).json({ success: false, message: 'ID no válido.' });
    }
  
    try {
      const result = await pool.query(
        'DELETE FROM authors WHERE id = $1 RETURNING id',
        [authorId]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Autor no encontrado.' });
      }
  
      res.json({ success: true, message: 'Autor eliminado correctamente.' });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar este autor porque está relacionado con otros registros.'
      });
    }
  };
  
  
  // ==========================================
  // GESTIÓN DE CATEGORÍAS
  // ==========================================
  
  export const getAdminCategories = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          c.*,
          COUNT(bc.book_id)::int AS books_count
        FROM categories c
        LEFT JOIN book_categories bc ON bc.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC
      `);
  
      res.json({ success: true, categories: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error obteniendo categorías.' });
    }
  };
  
  export const createCategory = async (req, res) => {
    const { name, slug, description } = req.body;
  
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
    }
  
    const finalSlug = createSlug(slug || name);
  
    try {
      const result = await pool.query(`
        INSERT INTO categories (name, slug, description)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name.trim(), finalSlug, description || null]);
  
      res.status(201).json({
        success: true,
        message: 'Categoría creada correctamente.',
        category: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se pudo crear la categoría. Comprueba que el nombre o slug no estén repetidos.'
      });
    }
  };
  
  export const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name, slug, description } = req.body;
  
    if (!isValidId(categoryId) || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'Datos de categoría no válidos.' });
    }
  
    try {
      const result = await pool.query(`
        UPDATE categories
        SET name = $1,
            slug = $2,
            description = $3
        WHERE id = $4
        RETURNING *
      `, [name.trim(), createSlug(slug || name), description || null, categoryId]);
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
      }
  
      res.json({
        success: true,
        message: 'Categoría actualizada.',
        category: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se pudo actualizar la categoría. Comprueba que el slug no esté repetido.'
      });
    }
  };
  
  export const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
  
    if (!isValidId(categoryId)) {
      return res.status(400).json({ success: false, message: 'ID no válido.' });
    }
  
    try {
      const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 RETURNING id',
        [categoryId]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Categoría no encontrada.' });
      }
  
      res.json({ success: true, message: 'Categoría eliminada correctamente.' });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se puede eliminar esta categoría porque está relacionada con otros registros.'
      });
    }
  };
  
  
  // ==========================================
  // GESTIÓN DE CAPÍTULOS
  // ==========================================
  
  export const getAdminChapters = async (req, res) => {
    const { bookId } = req.params;
  
    if (!isValidId(bookId)) {
      return res.status(400).json({ success: false, message: 'ID de libro no válido.' });
    }
  
    try {
      const result = await pool.query(`
        SELECT *
        FROM chapters
        WHERE book_id = $1
        ORDER BY chapter_number ASC
      `, [bookId]);
  
      res.json({ success: true, chapters: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error obteniendo capítulos.' });
    }
  };
  
  export const createChapter = async (req, res) => {
    const { bookId } = req.params;
    const { chapter_number, title, content } = req.body;
  
    if (!isValidId(bookId) || !Number.isInteger(Number(chapter_number)) ||
        Number(chapter_number) < 1 || !title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Indica un número de capítulo válido y un título.'
      });
    }
  
    try {
      const result = await pool.query(`
        INSERT INTO chapters (book_id, chapter_number, title, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [bookId, Number(chapter_number), title.trim(), content || '']);
  
      res.status(201).json({
        success: true,
        message: 'Capítulo creado correctamente.',
        chapter: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se pudo crear el capítulo. Comprueba el libro y el número de capítulo.'
      });
    }
  };
  
  export const updateChapter = async (req, res) => {
    const { chapterId } = req.params;
    const { chapter_number, title, content } = req.body;
  
    if (!isValidId(chapterId) || !Number.isInteger(Number(chapter_number)) ||
        Number(chapter_number) < 1 || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'Datos del capítulo no válidos.' });
    }
  
    try {
      const result = await pool.query(`
        UPDATE chapters
        SET chapter_number = $1,
            title = $2,
            content = $3
        WHERE id = $4
        RETURNING *
      `, [Number(chapter_number), title.trim(), content || '', chapterId]);
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Capítulo no encontrado.' });
      }
  
      res.json({
        success: true,
        message: 'Capítulo actualizado.',
        chapter: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se pudo actualizar el capítulo.'
      });
    }
  };
  
  export const deleteChapter = async (req, res) => {
    const { chapterId } = req.params;
  
    if (!isValidId(chapterId)) {
      return res.status(400).json({ success: false, message: 'ID no válido.' });
    }
  
    try {
      const result = await pool.query(
        'DELETE FROM chapters WHERE id = $1 RETURNING id',
        [chapterId]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Capítulo no encontrado.' });
      }
  
      res.json({ success: true, message: 'Capítulo eliminado.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'No se pudo eliminar el capítulo.' });
    }
  };
  
  
  // ==========================================
  // GESTIÓN DE USUARIOS
  // ==========================================
  
  export const getAdminUsers = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          first_name,
          last_name,
          email,
          role,
          is_active,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 300
      `);
  
      res.json({ success: true, users: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error obteniendo usuarios.' });
    }
  };
  
  export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { role, is_active } = req.body;
  
    if (!isValidId(userId) ||
        !['user', 'author', 'admin'].includes(role) ||
        typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Datos de usuario no válidos.' });
    }
  
    if (String(req.user.id) === String(userId) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes quitarte tus propios permisos de administrador.'
      });
    }
  
    try {
      const result = await pool.query(`
        UPDATE users
        SET role = $1,
            is_active = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING id, first_name, last_name, email, role, is_active
      `, [role, is_active, userId]);
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }
  
      res.json({
        success: true,
        message: 'Usuario actualizado.',
        user: result.rows[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'No se pudo actualizar el usuario.' });
    }
  };
  
  
  // ==========================================
  // ELIMINAR LIBRO
  // ==========================================
  
  export const deleteBook = async (req, res) => {
    const { bookId } = req.params;
  
    if (!isValidId(bookId)) {
      return res.status(400).json({ success: false, message: 'ID de libro no válido.' });
    }
  
    try {
      const result = await pool.query(
        'DELETE FROM books WHERE id = $1 RETURNING id',
        [bookId]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ success: false, message: 'Libro no encontrado.' });
      }
  
      res.json({ success: true, message: 'Libro eliminado correctamente.' });
    } catch (error) {
      console.error(error);
      res.status(409).json({
        success: false,
        message: 'No se pudo eliminar el libro porque tiene registros relacionados.'
      });
    }
  };
