import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { sequelize } from "./db/index.js";

const PORT = process.env.PORT || 5000;

// Sync database and start server
sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL Connected");
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
