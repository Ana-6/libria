import pool from '../config/database.js';

const VALID_STATUSES = ['want_to_read', 'reading', 'completed', 'paused'];

// Obtener biblioteca personal
export const getLibrary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          ub.id AS user_book_id,
          ub.book_id,
          ub.reading_status,
          ub.added_at,
          b.title,
          b.description,
          b.cover_url,
          b.publisher,
          b.publication_year,
          b.language,
          EXISTS (
            SELECT 1
            FROM favorites f
            WHERE f.user_id = ub.user_id
              AND f.book_id = ub.book_id
          ) AS is_favorite,
          COALESCE(rp.percentage, 0) AS progress,
          rp.last_chapter_id,
          rp.updated_at AS progress_updated_at
       FROM user_books ub
       INNER JOIN books b ON b.id = ub.book_id
       LEFT JOIN reading_progress rp
         ON rp.user_id = ub.user_id
        AND rp.book_id = ub.book_id
       WHERE ub.user_id = $1
       ORDER BY ub.added_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, books: result.rows });
  } catch (error) {
    console.error('Error al consultar biblioteca:', error.message);
    res.status(500).json({
      success: false,
      message: 'No se pudo cargar tu biblioteca.'
    });
  }
};

// Agregar libro
export const addBook = async (req, res) => {
  try {
    const bookId = Number(req.body.book_id);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El identificador del libro no es válido.'
      });
    }

    const book = await pool.query(
      'SELECT id FROM books WHERE id = $1',
      [bookId]
    );

    if (!book.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el libro.'
      });
    }

    const result = await pool.query(
      `INSERT INTO user_books (user_id, book_id, reading_status)
       VALUES ($1, $2, 'want_to_read')
       ON CONFLICT (user_id, book_id) DO NOTHING
       RETURNING id, book_id, reading_status, added_at`,
      [req.user.id, bookId]
    );

    res.status(result.rowCount ? 201 : 200).json({
      success: true,
      message: result.rowCount
        ? 'Libro agregado a tu biblioteca.'
        : 'Este libro ya está en tu biblioteca.'
    });
  } catch (error) {
    console.error('Error al agregar libro:', error.message);
    res.status(500).json({
      success: false,
      message: 'No se pudo agregar el libro.'
    });
  }
};

// Cambiar estado de lectura
export const updateBookStatus = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const { reading_status } = req.body;

    if (!Number.isSafeInteger(bookId) || bookId <= 0 ||
        !VALID_STATUSES.includes(reading_status)) {
      return res.status(400).json({
        success: false,
        message: 'El libro o el estado indicado no son válidos.'
      });
    }

    const result = await pool.query(
      `UPDATE user_books
       SET reading_status = $1
       WHERE user_id = $2 AND book_id = $3
       RETURNING id, book_id, reading_status`,
      [reading_status, req.user.id, bookId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Este libro no está en tu biblioteca.'
      });
    }

    res.json({
      success: true,
      message: 'Estado de lectura actualizado.',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error.message);
    res.status(500).json({
      success: false,
      message: 'No se pudo actualizar el estado.'
    });
  }
};

// Eliminar libro de la biblioteca
export const removeBook = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    const result = await pool.query(
      `DELETE FROM user_books
       WHERE user_id = $1 AND book_id = $2
       RETURNING book_id`,
      [req.user.id, bookId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'El libro no está en tu biblioteca.'
      });
    }

    res.json({
      success: true,
      message: 'Libro eliminado de tu biblioteca.'
    });
  } catch (error) {
    console.error('Error al eliminar libro:', error.message);
    res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el libro.'
    });
  }
};

// Agregar o quitar favorito
export const toggleFavorite = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El identificador no es válido.'
      });
    }

    const existing = await pool.query(
      `SELECT 1 FROM favorites
       WHERE user_id = $1 AND book_id = $2`,
      [req.user.id, bookId]
    );

    if (existing.rowCount) {
      await pool.query(
        `DELETE FROM favorites
         WHERE user_id = $1 AND book_id = $2`,
        [req.user.id, bookId]
      );

      return res.json({
        success: true,
        is_favorite: false,
        message: 'Libro eliminado de favoritos.'
      });
    }

    const book = await pool.query(
      'SELECT id FROM books WHERE id = $1',
      [bookId]
    );

    if (!book.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el libro.'
      });
    }

    await pool.query(
      `INSERT INTO favorites (user_id, book_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, book_id) DO NOTHING`,
      [req.user.id, bookId]
    );

    res.json({
      success: true,
      is_favorite: true,
      message: 'Libro agregado a favoritos.'
    });
  } catch (error) {
    console.error('Error al actualizar favoritos:', error.message);
    res.status(500).json({
      success: false,
      message: 'No se pudieron actualizar los favoritos.'
    });
  }
};