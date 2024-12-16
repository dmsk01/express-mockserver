import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { authRoute } from './authRoute.js';
import { adminAuthMiddleware } from './middleware.js'

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Для передачи cookie или авторизационных заголовков
};

app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(adminAuthMiddleware);
app.use('/', authRoute);

// Пример защищённого админского маршрута
app.get("/admin/dashboard", (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
