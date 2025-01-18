import bcrypt from "bcrypt";
import express from "express";
import { readDb, getDBPath, writeDb } from "../utils.js";
import { adminAuthMiddleware } from "../middleware.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, async (req, res) => {
  try {
    const char = req.query.char;
    const db = readDb('/data/recipes.json').recipes;
    const data = Object.fromEntries(Object.entries(db).filter(([key, value]) => {
      if (key === char) {
        return value;
      }
    }));

    res.json(data);
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ message: "Failed to read the database" });
  }
});

router.get("/areas", adminAuthMiddleware, async (req, res) => {
  try {
    const db = readDb('/data/areas.json');
    res.json(db.areas);
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ message: "Failed to read the database" });
  }
});

router.get("/categories", adminAuthMiddleware, async (req, res) => {
  try {
    const db = readDb('/data/categories.json');
    res.json(db.categories);
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ message: "Failed to read the database" });
  }
});

router.get("/ingredients", adminAuthMiddleware, async (req, res) => {
  try {
    const db = readDb('/data/ingredients.json');
    res.json(db.ingredients);
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ message: "Failed to read the database" });
  }
});

export { router as recipesRouter };