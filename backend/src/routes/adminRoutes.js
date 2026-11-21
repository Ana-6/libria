import { Router } from 'express';

import {
  createAuthor,
  createBook,
  createCategory,
  createChapter,
  deleteAuthor,
  deleteBook,
  deleteCategory,
  deleteChapter,
  getAdminAuthors,
  getAdminBooks,
  getAdminCategories,
  getAdminChapters,
  getAdminOptions,
  getAdminUsers,
  getDashboard,
  updateAuthor,
  updateBook,
  updateBookStatus,
  updateCategory,
  updateChapter,
  updateUser
} from '../controllers/adminController.js';

import {
  getBookFiles,
  uploadBookFile,
  deleteBookFile
} from '../controllers/bookFileController.js';

import upload from '../middleware/bookUpload.js';

import {
  authenticateToken,
  authorizeRoles
} from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Panel
router.get('/dashboard', getDashboard);
router.get('/options', getAdminOptions);

// Libros
router.get('/books', getAdminBooks);
router.post('/books', createBook);
router.put('/books/:bookId', updateBook);
router.patch('/books/:bookId/status', updateBookStatus);
router.delete('/books/:bookId', deleteBook);

// Archivos PDF y EPUB
router.get('/books/:bookId/files', getBookFiles);
router.post('/books/:bookId/files', upload.single('file'), uploadBookFile);
router.delete('/files/:fileId', deleteBookFile);

// Autores
router.get('/authors', getAdminAuthors);
router.post('/authors', createAuthor);
router.put('/authors/:authorId', updateAuthor);
router.delete('/authors/:authorId', deleteAuthor);

// Categorías
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Capítulos
router.get('/books/:bookId/chapters', getAdminChapters);
router.post('/books/:bookId/chapters', createChapter);
router.put('/chapters/:chapterId', updateChapter);
router.delete('/chapters/:chapterId', deleteChapter);

// Usuarios
router.get('/users', getAdminUsers);
router.put('/users/:userId', updateUser);

export default router;
