import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'texttutor_super_secret_jwt_key_2026',
  jwtExpiresIn: '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
};
