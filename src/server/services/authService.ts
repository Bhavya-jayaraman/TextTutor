import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface TokenPayload {
  id: number;
  email: string;
  name: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
    const expiresIn = rememberMe ? '30d' : '7d';
    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  }
}
