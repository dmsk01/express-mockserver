import express from 'express';
import { readDb } from '../utils.js';
import { adminAuthMiddleware } from '../middleware.js'

const router = express.Router();

router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      const db = readDb();
      res.json(db.users);
    }
  } catch (error) {
    console.error('Error reading database:', error);
    res.status(500).json({ message: 'Failed to read the database' });
  }
});

export { router as adminRouter }