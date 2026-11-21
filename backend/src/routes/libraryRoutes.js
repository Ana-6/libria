import { Router } from 'express';
import {
    addBook,
    getLibrary,
    removeBook,
    toggleFavorite,
    updateBookStatus
} from '../controllers/libraryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getLibrary);
router.post('/', addBook);
router.patch('/:bookId/status', updateBookStatus);
router.delete('/:bookId', removeBook);
router.put('/:bookId/favorite', toggleFavorite);

export default router;