import { dbAsync } from '../config/db.js';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<UserRecord | undefined> {
    const sql = `SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`;
    return await dbAsync.get<UserRecord>(sql, [email.trim()]);
  }

  static async findById(id: number): Promise<UserRecord | undefined> {
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    return await dbAsync.get<UserRecord>(sql, [id]);
  }

  static async create(name: string, email: string, passwordHash: string): Promise<UserRecord> {
    const sql = `INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    const result = await dbAsync.run(sql, [name.trim(), email.trim().toLowerCase(), passwordHash]);
    
    const createdUser = await this.findById(result.lastID);
    if (!createdUser) {
      throw new Error('Failed to retrieve newly created user.');
    }
    return createdUser;
  }

  static async updateProfile(id: number, name: string, email: string): Promise<UserRecord> {
    const sql = `UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await dbAsync.run(sql, [name.trim(), email.trim().toLowerCase(), id]);
    
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error('User not found after update.');
    }
    return updatedUser;
  }

  static async updatePassword(id: number, passwordHash: string): Promise<void> {
    const sql = `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await dbAsync.run(sql, [passwordHash, id]);
  }

  static async deleteUser(id: number): Promise<void> {
    const sql = `DELETE FROM users WHERE id = ?`;
    await dbAsync.run(sql, [id]);
  }
}

