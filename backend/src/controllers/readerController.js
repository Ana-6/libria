import pool from '../config/database.js';
import supabase from '../config/supabase.js';

const BUCKET = process.env.SUPABASE_BUCKET || 'libria-books';

export const getReaderBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const format = String(req.query.format || '').toLowerCase();

    if (!/^\d+$/.test(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de libro no válido.'
      });
    }

    if (format && !['pdf', 'epub'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de lectura no válido.'
      });
    }

    const bookResult = await pool.query(`
      SELECT id, title, cover_url, publication_status, rights_status
      FROM books
      WHERE id = $1
        AND publication_status = 'approved'
        AND rights_status IN ('verified', 'not_required')
      LIMIT 1
    `, [bookId]);

    if (!bookResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'Este libro no está disponible para lectura.'
      });
    }

    const values = [bookId];
    let formatCondition = '';

    if (format) {
      values.push(format);
      formatCondition = 'AND file_format = $2';
    }

    const fileResult = await pool.query(`
      SELECT id, storage_path, original_filename, file_format, mime_type
      FROM book_files
      WHERE book_id = $1
        AND is_active = TRUE
        ${formatCondition}
      ORDER BY created_at DESC
      LIMIT 1
    `, values);

    if (!fileResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: format
          ? `No hay un archivo ${format.toUpperCase()} disponible.`
          : 'Este libro todavía no tiene un archivo de lectura.'
      });
    }

    const file = fileResult.rows[0];

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 3600);

    if (signedError) throw signedError;

    const progressResult = await pool.query(`
      SELECT position, percentage, updated_at
      FROM reading_progress
      WHERE user_id = $1 AND book_id = $2
      LIMIT 1
    `, [req.user.id, bookId]);

    return res.json({
      success: true,
      book: bookResult.rows[0],
      file: {
        id: file.id,
        filename: file.original_filename,
        format: file.file_format,
        mime_type: file.mime_type,
        url: signedData.signedUrl
      },
      progress: progressResult.rows[0] || {
        position: 0,
        percentage: 0
      }
    });
  } catch (error) {
    console.error('Error abriendo libro:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo abrir el libro.'
    });
  }
};

export const saveReadingProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const position = Number(req.body.position);
    const percentage = Number(req.body.percentage);

    if (
      !/^\d+$/.test(bookId) ||
      !Number.isSafeInteger(position) ||
      position < 0 ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Los datos del progreso no son válidos.'
      });
    }

    const bookResult = await pool.query(`
      SELECT id
      FROM books
      WHERE id = $1
        AND publication_status = 'approved'
        AND rights_status IN ('verified', 'not_required')
      LIMIT 1
    `, [bookId]);

    if (!bookResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: 'El libro no está disponible.'
      });
    }

    const result = await pool.query(`
      INSERT INTO reading_progress (
        user_id,
        book_id,
        position,
        percentage,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, book_id)
      DO UPDATE SET
        position = EXCLUDED.position,
        percentage = EXCLUDED.percentage,
        updated_at = NOW()
      RETURNING position, percentage, updated_at
    `, [req.user.id, bookId, position, percentage]);

    return res.json({
      success: true,
      message: 'Progreso guardado.',
      progress: result.rows[0]
    });
  } catch (error) {
    console.error('Error guardando progreso:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo guardar el progreso.'
    });
  }
};
