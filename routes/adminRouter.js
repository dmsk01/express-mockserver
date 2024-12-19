import bcrypt from 'bcrypt';
import express from 'express';
import { readDb, writeDb } from '../utils.js';
import { adminAuthMiddleware } from '../middleware.js'

const router = express.Router();

router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      const db = readDb();
      res.json(db.users.map(user => ({ id: user.id, username: user.username, role: user.role })));
    }
  } catch (error) {
    console.error('Error reading database:', error);
    res.status(500).json({ message: 'Failed to read the database' });
  }
});


router.post("/register", adminAuthMiddleware, async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === 'admin';

  if (isAdmin) {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
      }
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

      res.status(201).json({
        message: "User registered successfully",
        users: users.map(user => ({ id: user.id, username: user.username, role: user.role }))
      });
    } catch (error) {
      res.status(500).json({ error: "Error registering user" });
    }
  }

});

export { router as adminRouter }