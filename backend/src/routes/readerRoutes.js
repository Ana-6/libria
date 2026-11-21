import { Router } from 'express';
import {
  getReaderBook,
  saveReadingProgress
} from '../controllers/readerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/books/:bookId', getReaderBook);
router.put('/books/:bookId/progress', saveReadingProgress);

export default router;
