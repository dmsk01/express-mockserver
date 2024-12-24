import bcrypt from "bcrypt";
import express from "express";
import { readDb, writeDb } from "../utils.js";
import { adminAuthMiddleware } from "../middleware.js";

const router = express.Router();

router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === "admin";

    if (isAdmin) {
      const db = readDb();
      res.json(
        db.users.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
        }))
      );
    }
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ message: "Failed to read the database" });
  }
});

router.post("/register", adminAuthMiddleware, async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin";

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

      const newUser = {
        id: Date.now(),
        username,
        password: hashedPassword,
        role,
      };
      users.push(newUser);

      db.users = users;
      writeDb(db);

      res.status(201).json({
        message: "User registered successfully",
        user: { id: newUser.id, username: newUser.username, role: newUser.role },
      });
    } catch (error) {
      res.status(500).json({ error: "Error registering user" });
    }
  }
});

router.put("/users/:id", adminAuthMiddleware, async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin";

  if (isAdmin) {
    try {
      const { id } = req.params;
      const { username, password, role } = req.body;

      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const db = readDb();
      const users = db.users || [];
      const userIndex = users.findIndex((u) => u.id === parseInt(id));

      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user fields if provided
      if (username) {
        const existingUser = users.find(
          (u) => u.username === username && u.id !== parseInt(id)
        );
        if (existingUser) {
          return res
            .status(400)
            .json({ error: "Username already taken by another user" });
        }
        users[userIndex].username = username;
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        users[userIndex].password = hashedPassword;
      }

      if (role) {
        users[userIndex].role = role;
      }

      // Save changes to database
      db.users = users;
      writeDb(db);

      res.status(200).json({
        message: "User updated successfully",
        user: {
          id: users[userIndex].id,
          username: users[userIndex].username,
          role: users[userIndex].role,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Error updating user" });
    }
  } else {
    res.status(403).json({ error: "Access denied" });
  }
});

router.delete("/users/:id", adminAuthMiddleware, async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin";

  if (isAdmin) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const db = readDb();
      const users = db.users || [];
      const userIndex = users.findIndex((u) => u.id === parseInt(id));

      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove the user from the array
      const deletedUser = users.splice(userIndex, 1)[0];

      // Save changes to database
      db.users = users;
      writeDb(db);

      res.status(200).json({
        message: "User deleted successfully",
        user: {
          id: deletedUser.id,
          username: deletedUser.username,
          role: deletedUser.role,
        },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Error deleting user" });
    }
  } else {
    res.status(403).json({ error: "Access denied" });
  }
});

export { router as adminRouter };
