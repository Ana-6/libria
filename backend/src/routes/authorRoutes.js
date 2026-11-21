import { Router } from 'express';
import {
  getAuthorById,
  getAuthors
} from '../controllers/authorController.js';

const router = Router();

router.get('/', getAuthors);
router.get('/:authorId', getAuthorById);

export default router;
