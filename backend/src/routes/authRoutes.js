
import { Router } from 'express';

import {
    changePassword,
    getProfile,
    login,
    register,
    updateProfile
} from '../controllers/authController.js';

import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, getProfile);

router.put('/me', authenticateToken, updateProfile);

router.put('/me/password', authenticateToken, changePassword);

export default router;
