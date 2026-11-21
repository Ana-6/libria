import { randomUUID } from 'node:crypto';
import pool from '../config/database.js';
import supabase from '../config/supabase.js';

const BUCKET = process.env.SUPABASE_BUCKET || 'libria-books';

const isValidId = (id) => /^\d+$/.test(String(id));

export const getBookFiles = async (req, res) => {
  const { bookId } = req.params;

  if (!isValidId(bookId)) {
    return res.status(400).json({
      success: false,
      message: 'Identificador de libro no válido.'
    });
  }

  try {
    const result = await pool.query(`
      SELECT id, book_id, original_filename, file_format,
             mime_type, file_size, created_at
      FROM book_files
      WHERE book_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `, [bookId]);

    return res.json({
      success: true,
      files: result.rows
    });
  } catch (error) {
    console.error('Error consultando archivos:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los archivos.'
    });
  }
};

export const uploadBookFile = async (req, res) => {
  const { bookId } = req.params;
  const file = req.file;

  if (!isValidId(bookId)) {
    return res.status(400).json({
      success: false,
      message: 'Identificador de libro no válido.'
    });
  }

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'Selecciona un archivo PDF o EPUB.'
    });
  }

  const format = req.fileFormat;
  const isPdf = format === 'pdf';
  const isValidSignature = isPdf
    ? file.buffer.subarray(0, 5).toString() === '%PDF-'
    : file.buffer[0] === 0x50 &&
      file.buffer[1] === 0x4B &&
      [0x03, 0x05, 0x07].includes(file.buffer[2]) &&
      [0x04, 0x06, 0x08].includes(file.buffer[3]);

  if (!isValidSignature) {
    return res.status(400).json({
      success: false,
      message: 'El contenido del archivo no coincide con su formato.'
    });
  }

  let storagePath;

  try {
    const bookResult = await pool.query(
      'SELECT id FROM books WHERE id = $1',
      [bookId]
    );

    if (!bookResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'El libro no existe.'
      });
    }

    const oldResult = await pool.query(`
      SELECT id, storage_path
      FROM book_files
      WHERE book_id = $1
        AND file_format = $2
        AND is_active = TRUE
    `, [bookId, format]);

    const extension = format;
    storagePath = `${bookId}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE book_files
        SET is_active = FALSE
        WHERE book_id = $1
          AND file_format = $2
          AND is_active = TRUE
      `, [bookId, format]);

      const result = await client.query(`
        INSERT INTO book_files (
          book_id,
          storage_path,
          original_filename,
          mime_type,
          file_format,
          file_size,
          uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, book_id, original_filename,
                  file_format, mime_type, file_size, created_at
      `, [
        bookId,
        storagePath,
        file.originalname,
        file.mimetype,
        format,
        file.size,
        req.user.id
      ]);

      await client.query('COMMIT');

      const oldPaths = oldResult.rows.map((item) => item.storage_path);

      if (oldPaths.length) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(oldPaths);

        if (removeError) {
          console.error('No se pudo retirar el archivo anterior:', removeError.message);
        }
      }

      return res.status(201).json({
        success: true,
        message: `Archivo ${format.toUpperCase()} cargado correctamente.`,
        file: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');

      await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error subiendo archivo:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo cargar el archivo del libro.'
    });
  }
};

export const deleteBookFile = async (req, res) => {
  const { fileId } = req.params;

  if (!isValidId(fileId)) {
    return res.status(400).json({
      success: false,
      message: 'Identificador de archivo no válido.'
    });
  }

  try {
    const result = await pool.query(`
      SELECT id, storage_path
      FROM book_files
      WHERE id = $1 AND is_active = TRUE
    `, [fileId]);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    const file = result.rows[0];

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([file.storage_path]);

    if (storageError) {
      throw storageError;
    }

    await pool.query(`
      UPDATE book_files
      SET is_active = FALSE
      WHERE id = $1
    `, [fileId]);

    return res.json({
      success: true,
      message: 'Archivo eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error eliminando archivo:', error.message);

    return res.status(500).json({
      success: false,
      message: 'No se pudo eliminar el archivo.'
    });
  }
};
