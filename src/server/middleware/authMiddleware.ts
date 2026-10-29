import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required.' });
    return;
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired access token.' });
    return;
  }
};
