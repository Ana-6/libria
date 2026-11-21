
import cors from 'cors';
import express from 'express';
import pool from './config/database.js';
import adminRoutes from './routes/adminRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import readerRoutes from './routes/readerRoutes.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '¡El servidor de Libria está funcionando!',
    application: 'Libria API'
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT NOW() AS server_time, current_database() AS database'
    );

    res.json({
      success: true,
      message: 'PostgreSQL conectado correctamente.',
      database: result.rows[0].database,
      serverTime: result.rows[0].server_time
    });
  } catch (error) {
    console.error('Error de conexión:', error.message);

    res.status(500).json({
      success: false,
      message: 'No se pudo conectar con PostgreSQL.'
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reader', readerRoutes);
export default app;
