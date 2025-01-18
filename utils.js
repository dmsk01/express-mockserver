import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();
export const getDBPath = (dbName) => path.join(__dirname, dbName);
export const readDb = (dbPath = "db.json") => {
  const dbName = getDBPath(dbPath);
  return JSON.parse(fs.readFileSync(dbName))
};
export const writeDb = (data, dbPath = "db.json") => fs.writeFileSync(getDBPath(dbPath), JSON.stringify(data, null, 2));
export const cleanExpiredTokens = (tokens) => {
  return tokens.filter((token) => new Date(token.expiresAt) > new Date());
};