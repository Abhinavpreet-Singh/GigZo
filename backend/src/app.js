import express from "express";
import cors from "cors";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "gigzo-backend",
    status: "ok",
  });
});

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import policyRoutes from "./modules/policies/policy.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const message = err?.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
