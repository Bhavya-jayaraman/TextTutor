import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
} from '../middleware/validationMiddleware.js';

const router = Router();

router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/forgot-password', validateForgotPassword, AuthController.forgotPassword);

// Protected routes
router.get('/me', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.delete('/account', authenticateToken, AuthController.deleteAccount);

export default router;

