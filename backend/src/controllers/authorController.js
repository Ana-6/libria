import pool from '../config/database.js';

// Obtener el directorio de autores públicos.
export const getAuthors = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const values = [];
    let searchCondition = '';

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      searchCondition = `AND a.name ILIKE $1`;
    }

    const result = await pool.query(`
      SELECT
        a.id,
        a.name,
        a.biography,
        a.photo_url,
        COUNT(DISTINCT b.id)::integer AS total_books
      FROM authors a
      LEFT JOIN book_authors ba ON ba.author_id = a.id
      LEFT JOIN books b
        ON b.id = ba.book_id
        AND b.publication_status = 'approved'
      WHERE a.profile_status = 'approved'
        ${searchCondition}
      GROUP BY a.id
      ORDER BY a.name ASC
    `, values);

    res.json({
      success: true,
      authors: result.rows
    });
  } catch (error) {
    console.error('Error al obtener autores:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudieron cargar los autores.'
    });
  }
};

// Obtener el perfil de un autor y sus libros publicados.
export const getAuthorById = async (req, res) => {
  try {
    const { authorId } = req.params;

    if (!/^\d+$/.test(authorId)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de autor inválido.'
      });
    }

    const authorResult = await pool.query(`
      SELECT
        a.id,
        a.name,
        a.biography,
        a.photo_url,
        COUNT(DISTINCT b.id)::integer AS total_books
      FROM authors a
      LEFT JOIN book_authors ba ON ba.author_id = a.id
      LEFT JOIN books b
        ON b.id = ba.book_id
        AND b.publication_status = 'approved'
      WHERE a.id = $1
        AND a.profile_status = 'approved'
      GROUP BY a.id
    `, [authorId]);

    if (authorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No encontramos ese autor.'
      });
    }

    const booksResult = await pool.query(`
      SELECT
        b.id,
        b.title,
        b.description,
        b.cover_url,
        b.publisher,
        b.publication_year,
        b.language
      FROM books b
      JOIN book_authors ba ON ba.book_id = b.id
      WHERE ba.author_id = $1
        AND b.publication_status = 'approved'
      ORDER BY b.created_at DESC
    `, [authorId]);

    res.json({
      success: true,
      author: {
        ...authorResult.rows[0],
        books: booksResult.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil del autor:', error);

    res.status(500).json({
      success: false,
      message: 'No se pudo cargar el perfil del autor.'
    });
  }
};
