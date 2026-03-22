import express from "express";
const app = express();

app.use(express.json());

import userRoutes from "./routes/user.routes.js";

app.use("/api/users", userRoutes);

export default app;