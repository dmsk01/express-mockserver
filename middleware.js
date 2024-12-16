const SECRET_KEY = "your_secret_key";
import jwt from 'jsonwebtoken';

// Middleware для защиты админских маршрутов
export const adminAuthMiddleware = (req, res, next) => {
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