import { Sequelize } from "sequelize";
import { NODE_ENV } from "../utils/constant";

const requiredEnvVariables = [
  "PG_DATABASE_NAME",
  "PG_USER",
  "PG_PASSWORD",
  "PG_HOST",
  "PG_DB_PORT",
];

requiredEnvVariables.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
});

const dbName = process.env.PG_DATABASE_NAME as string;
const dbUser = process.env.PG_USER as string;
const dbPassword = process.env.PG_PASSWORD as string;
const dbHost = process.env.PG_HOST as string;
const dbPort = process.env.PG_DB_PORT ? parseInt(process.env.PG_DB_PORT) : 5432;
const env = process.env.NODE_ENV || NODE_ENV.DEV;

const sslOptions =
  env === NODE_ENV.PROD
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {};

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "postgres",
  port: dbPort,
  logging: env !== NODE_ENV.PROD,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  ...sslOptions,
});

export async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

testDbConnection();

export default sequelize;
