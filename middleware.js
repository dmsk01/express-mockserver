import jwt from 'jsonwebtoken';

// Middleware для защиты админских маршрутов
export const adminAuthMiddleware = (req, res, next) => {
  if (req.path.startsWith("/admin")) {
    const token = req.cookies.accessToken; // Извлекаем токен из куки

    if (!token) {
      return res.status(403).json({ error: "Access token required" });
    }
    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY);
      console.log("Decoded payload from auth middleware:", payload);

      if (payload.role.trim() !== "admin") {
        return res.status(403).json({ error: "Forbidden: Admins only" });
      }
      req.user = payload;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ error: "Token expired" });
      } else {
        res.status(401).json({ error: "Invalid token" });
      }
    }
  } else {
    next();
  }
};

export const verifyAccessTokenMiddleware = (req, res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(403).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(accessToken, process.env.SECRET_KEY);
    req.user = payload; // Сохраняем информацию о пользователе
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired access token" });
  }
};