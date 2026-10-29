import { Request, Response, NextFunction } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Name must be at least 2 characters long.' });
    return;
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({ success: false, message: 'A valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({ success: false, message: 'A valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    res.status(400).json({ success: false, message: 'Password is required.' });
    return;
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    res.status(400).json({ success: false, message: 'A valid email address is required.' });
    return;
  }

  next();
};
