import fs from 'fs';
import path from 'path';

// Ensure data directory exists for persistent storage
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = path.join(dataDir, 'users.json');

export interface UserData {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

let autoIncrementId = 1;

function loadUsers(): UserData[] {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf8');
      const users = JSON.parse(raw);
      if (Array.isArray(users)) {
        if (users.length > 0) {
          const maxId = Math.max(...users.map((u: any) => (typeof u.id === 'number' ? u.id : 0)));
          autoIncrementId = maxId + 1;
        }
        return users;
      }
    }
  } catch (err) {
    console.error('Error reading user database file:', err);
  }
  return [];
}

function saveUsers(users: UserData[]): void {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving user database file:', err);
  }
}

// Promisified database operations compatible with SQL queries
export const dbAsync = {
  get: async <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
    const users = loadUsers();
    const sqlUpper = sql.toUpperCase();

    if (sqlUpper.includes('WHERE LOWER(EMAIL)')) {
      const emailParam = String(params[0] || '').toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase() === emailParam);
      return user as T | undefined;
    }

    if (sqlUpper.includes('WHERE ID =')) {
      const idParam = Number(params[0]);
      const user = users.find((u) => u.id === idParam);
      return user as T | undefined;
    }

    return undefined;
  },

  all: async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
    const users = loadUsers();
    return users as T[];
  },

  run: async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    const users = loadUsers();
    const sqlUpper = sql.toUpperCase();

    if (sqlUpper.includes('INSERT INTO USERS')) {
      const [name, email, passwordHash] = params;
      const now = new Date().toISOString();
      const newId = autoIncrementId++;
      const newUser: UserData = {
        id: newId,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(passwordHash),
        created_at: now,
        updated_at: now,
      };
      users.push(newUser);
      saveUsers(users);
      return { lastID: newId, changes: 1 };
    }

    if (sqlUpper.includes('UPDATE USERS SET NAME =')) {
      const [name, email, id] = params;
      const userIndex = users.findIndex((u) => u.id === Number(id));
      if (userIndex !== -1) {
        users[userIndex].name = String(name).trim();
        users[userIndex].email = String(email).trim().toLowerCase();
        users[userIndex].updated_at = new Date().toISOString();
        saveUsers(users);
        return { lastID: Number(id), changes: 1 };
      }
      return { lastID: Number(id), changes: 0 };
    }

    if (sqlUpper.includes('UPDATE USERS SET PASSWORD =')) {
      const [passwordHash, id] = params;
      const userIndex = users.findIndex((u) => u.id === Number(id));
      if (userIndex !== -1) {
        users[userIndex].password = String(passwordHash);
        users[userIndex].updated_at = new Date().toISOString();
        saveUsers(users);
        return { lastID: Number(id), changes: 1 };
      }
      return { lastID: Number(id), changes: 0 };
    }

    return { lastID: 0, changes: 0 };
  },
};

export default dbAsync;
