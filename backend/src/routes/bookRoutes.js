
import { Router } from 'express';
import {
    getBookById,
    getBookCategories,
    getBooks
} from '../controllers/bookController.js';

const router = Router();

router.get('/', getBooks);
router.get('/categories', getBookCategories);
router.get('/:bookId', getBookById);

export default router;
