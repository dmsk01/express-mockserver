import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();
export const dbPath = path.join(__dirname, "db.json");
export const readDb = () => JSON.parse(fs.readFileSync(dbPath));
export const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
export const cleanExpiredTokens = (tokens) => {
  return tokens.filter((token) => new Date(token.expiresAt) > new Date());
};