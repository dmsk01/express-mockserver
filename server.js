import path from 'path';
import fs from 'fs';

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';

const __dirname = path.resolve();

const app = express();
const SECRET_KEY = "your_secret_key";
const REFRESH_SECRET_KEY = "your_refresh_secret_key";
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Для передачи cookie или авторизационных заголовков
};

app.use(bodyParser.json());
app.use(cors(corsOptions));

const dbPath = path.join(__dirname, "db.json");
const readDb = () => JSON.parse(fs.readFileSync(dbPath));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
const cleanExpiredTokens = (tokens) => {
  return tokens.filter((token) => new Date(token.expiresAt) > new Date());
};

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = readDb();
    const users = db.users || [];

    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = { id: Date.now(), username, password: hashedPassword, role };
    users.push(newUser);

    db.users = users;
    writeDb(db);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const db = readDb();
  db.tokens = cleanExpiredTokens(db.tokens);
  const users = db.users || [];
  const tokens = db.tokens || [];

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).json({ error: "Invalid username or password" });

  const existingToken = tokens.find(
    (token) =>
      token.userId === user.id &&
      new Date(token.expiresAt) > new Date()
  );

  let refreshToken;

  if (existingToken) {
    refreshToken = existingToken.refreshToken;
  } else {
    refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY, { expiresIn: "7d" });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    db.tokens.push({
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      refreshToken,
    });
    writeDb(db);
  }

  const accessToken = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "15m" });

  res.json({
    accessToken, refreshToken, user: {
      id: user.id,
      name: user.username,
      role: user.role
    }
  });
});

app.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  const db = readDb();

  db.tokens = db.tokens.filter(token => token.refreshToken !== refreshToken);
  writeDb(db);
  res.json({ message: "Logged out successfully" });
});

// Эндпоинт для обновления accessToken с помощью refreshToken
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token is required" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
    const accessToken = jwt.sign({ id: payload.id, role: payload.role }, SECRET_KEY, { expiresIn: "15m" });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Middleware для защиты админских маршрутов
const adminAuthMiddleware = (req, res, next) => {
  if (req.path.startsWith("/admin")) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(403).json({ error: "Authorization header required" });

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, SECRET_KEY);
      if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden: Admins only" });
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  } else {
    next();
  }
};

// Применяем middleware для всех маршрутов
app.use(adminAuthMiddleware);

// Пример защищённого админского маршрута
app.get("/admin/dashboard", (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

// Запуск сервера
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
