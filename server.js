import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/authRouter.js";
import { adminRouter } from "./routes/adminRouter.js";
import { adminAuthMiddleware } from "./middleware.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Для передачи cookie или авторизационных заголовков
};

app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(adminAuthMiddleware);
app.use("/", authRouter);
app.use("/admin", adminRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
