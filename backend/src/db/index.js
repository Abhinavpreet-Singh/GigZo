import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath, override: true });

const useRemotePostgres = process.env.USE_REMOTE_POSTGRES === "true";
const useLocalSqlite = !useRemotePostgres;

const sequelize = useLocalSqlite
  ? new Sequelize({
      dialect: "sqlite",
      storage: path.resolve(__dirname, "../../gigzo-dev.sqlite"),
      logging: false,
    })
  : new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });

export default sequelize;
export { sequelize };
