
import pool from '../config/database.js';

export const getBooks = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      language = '',
      sort = 'newest'
    } = req.query;

    const values = [];
    const conditions = ["b.publication_status = 'approved'"];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      const index = values.length;

      conditions.push(`
        (
          b.title ILIKE $${index}
          OR b.description ILIKE $${index}
          OR EXISTS (
            SELECT 1
            FROM book_authors ba
            JOIN authors a ON a.id = ba.author_id
            WHERE ba.book_id = b.id
              AND a.name ILIKE $${index}
          )
        )
      `);
    }

    if (category) {
      values.push(category);
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category_id
          WHERE bc.book_id = b.id
            AND c.slug = $${values.length}
        )
      `);
    }

    if (language) {
      values.push(language);
      conditions.push(`b.language = $${values.length}`);
    }

    const orderBy = sort === 'oldest'
      ? 'b.publication_year ASC NULLS LAST, b.created_at ASC'
      : sort === 'title'
        ? 'b.title ASC'
        : 'b.created_at DESC';

    const result = await pool.query(`
      SELECT
        b.id,
        b.title,
        b.description,
        b.isbn,
        b.cover_url,
        b.publisher,
        b.publication_year,
        b.language,
        COALESCE((
          SELECT json_agg(DISTINCT jsonb_build_object(
            'id', a.id, 'name', a.name
          ))
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author_id
          WHERE ba.book_id = b.id
        ), '[]'::json) AS authors,
        COALESCE((
          SELECT json_agg(DISTINCT jsonb_build_object(
            'id', c.id, 'name', c.name, 'slug', c.slug
          ))
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category_id
          WHERE bc.book_id = b.id
        ), '[]'::json) AS categories
      FROM books b
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT 100
    `, values);

    res.json({
      success: true,
      total: result.rowCount,
      books: result.rows
    });
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo cargar el catálogo.'
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!/^\d+$/.test(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de libro inválido.'
      });
    }

    const result = await pool.query(`
      SELECT
        b.id,
        b.title,
        b.description,
        b.isbn,
        b.cover_url,
        b.publisher,
        b.publication_year,
        b.language,
        COALESCE((
          SELECT json_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'biography', a.biography,
            'photo_url', a.photo_url
          ))
          FROM book_authors ba
          JOIN authors a ON a.id = ba.author_id
          WHERE ba.book_id = b.id
        ), '[]'::json) AS authors,
        COALESCE((
          SELECT json_agg(DISTINCT jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
          ))
          FROM book_categories bc
          JOIN categories c ON c.id = bc.category_id
          WHERE bc.book_id = b.id
        ), '[]'::json) AS categories,
        (
          SELECT COUNT(*)::integer
          FROM chapters ch
          WHERE ch.book_id = b.id
            AND ch.status = 'published'
        ) AS chapter_count
      FROM books b
      WHERE b.id = $1
        AND b.publication_status = 'approved'
      LIMIT 1
    `, [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No encontramos ese libro.'
      });
    }

    res.json({
      success: true,
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener libro:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudieron cargar los detalles del libro.'
    });
  }
};

export const getBookCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        COUNT(DISTINCT b.id)::integer AS book_count
      FROM categories c
      LEFT JOIN book_categories bc ON bc.category_id = c.id
      LEFT JOIN books b
        ON b.id = bc.book_id
        AND b.publication_status = 'approved'
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudieron cargar las categorías.'
    });
  }
};
