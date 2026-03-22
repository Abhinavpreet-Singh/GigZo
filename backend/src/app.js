import express from "express";
<<<<<<< HEAD
import cors from "cors";
const app = express();

app.use(cors());
app.use(express.json());

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
=======
const app = express();

app.use(express.json());

import userRoutes from "./routes/user.routes.js";

app.use("/api/users", userRoutes);
>>>>>>> e4d510c (Implement user profile module with schema, controller, and routes)

export default app;