import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { readDb, writeDb, cleanExpiredTokens } from "../utils.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const db = readDb();
  db.tokens = cleanExpiredTokens(db.tokens);
  const users = db.users || [];
  const tokens = db.tokens || [];

  const user = users.find((u) => u.username === username);
  if (!user)
    return res.status(401).json({ error: "Invalid username or password" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(401).json({ error: "Invalid username or password" });

  const existingToken = tokens.find(
    (token) =>
      token.userId === user.id && new Date(token.expiresAt) > new Date()
  );

  let refreshToken;

  if (existingToken) {
    refreshToken = existingToken.refreshToken;
  } else {
    refreshToken = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.REFRESH_SECRET_KEY,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    db.tokens.push({
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
      refreshToken,
    });
    writeDb(db);
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: "10m" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 10 * 60 * 1000, // 10 минут
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  });

  res.json({
    user: {
      id: user.id,
      name: user.username,
      role: user.role,
    },
  });
});

router.post("/logout", (req, res) => {
  const { refreshToken } = req.cookies;
  const db = readDb();

  db.tokens = db.tokens.filter((token) => token.refreshToken !== refreshToken);
  writeDb(db);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// Эндпоинт для обновления accessToken с помощью refreshToken
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.cookies;


  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" })
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    console.log("Payload from refreshToken:", payload);
    const accessToken = jwt.sign(
      { id: payload.id, role: payload.role },
      process.env.SECRET_KEY,
      { expiresIn: "10m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 10 * 60 * 1000, // 10 минут
    });

    res.json({ message: "Access token refreshed" });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get("/validate", (req, res) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  try {
    const payload = jwt.verify(accessToken, process.env.SECRET_KEY);
    res.json({ message: "Token is valid", user: payload });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export { router as authRouter };
