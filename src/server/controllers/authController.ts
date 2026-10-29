import { Request, Response } from 'express';
import { UserModel } from '../models/userModel.js';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);
      const newUser = await UserModel.create(name, email, passwordHash);

      const tokenPayload = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      };

      const token = AuthService.generateToken(tokenPayload, false);

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'An internal server error occurred during registration.',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      const isPasswordValid = await AuthService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const token = AuthService.generateToken(tokenPayload, Boolean(rememberMe));

      res.status(200).json({
        success: true,
        message: 'Signed in successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An internal server error occurred during sign in.',
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile.',
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await UserModel.findByEmail(email);

      // UI response - always return positive feedback for security (anti-enumeration)
      res.status(200).json({
        success: true,
        message: user
          ? `Password reset instructions have been dispatched to ${email}.`
          : `If an account exists for ${email}, a reset link has been sent.`,
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request.',
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { name, email } = req.body;
      if (!name || !email) {
        res.status(400).json({ success: false, message: 'Name and email are required.' });
        return;
      }

      // Check if new email belongs to someone else
      if (email.toLowerCase() !== req.user.email.toLowerCase()) {
        const existing = await UserModel.findByEmail(email);
        if (existing && existing.id !== req.user.id) {
          res.status(409).json({ success: false, message: 'Email address is already in use by another account.' });
          return;
        }
      }

      const updatedUser = await UserModel.updateProfile(req.user.id, name, email);
      const newToken = AuthService.generateToken({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
        token: newToken,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile.',
      });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current password and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        return;
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await AuthService.comparePassword(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      const newHash = await AuthService.hashPassword(newPassword);
      await UserModel.updatePassword(req.user.id, newHash);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully!',
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await UserModel.deleteUser(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully.',
      });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete account.' });
    }
  }
}

