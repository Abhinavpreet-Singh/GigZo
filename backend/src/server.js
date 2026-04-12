import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath, override: true });

const PORT = process.env.PORT || 5000;

const [{ default: app }, { sequelize }] = await Promise.all([
  import("./app.js"),
  import("./db/index.js"),
]);

// Import models to register associations before sync
await import("./models/index.js");

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
    if (err?.original?.code === "ENOTFOUND") {
      console.error(
        "Database host lookup failed. Verify DATABASE_URL host, internet/VPN access, and DNS policy (the current resolver may be blocking *.neon.tech)."
      );
    }
    console.error("Database connection error:", err);
    process.exit(1);
  });
