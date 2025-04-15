import { Sequelize } from "sequelize";
import { NODE_ENV } from "../utils/constants";
import { getSecret } from "../utils/azureSecrets";

let sequelize: Sequelize;

const requiredEnvVariables = [
  "MAINDB_NAME",
  "MAINDB_USERNAME",
  "MAINDB_PASSWORD",
  "MAINDB_ENDPOINT",
];

requiredEnvVariables.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const dbPort = process.env.MAIN_PG_DB_PORT
  ? parseInt(process.env.MAIN_PG_DB_PORT)
  : 5432;
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

async function getAzureSecrets() {
  try {
    const secrets = await Promise.all([
      getSecret(process.env.MAINDB_NAME as string),
      getSecret(process.env.MAINDB_USERNAME as string),
      getSecret(process.env.MAINDB_PASSWORD as string),
      getSecret(process.env.MAINDB_ENDPOINT as string),
    ]);

    return {
      DB_NAME: secrets[0],
      DB_USER: secrets[1],
      DB_PASSWORD: secrets[2],
      DB_HOST: secrets[3],
    };
  } catch (error) {
    throw new Error(
      `Error fetching Azure secrets: ${(error as Error).message}`
    );
  }
}

export async function initMainDbSequelize() {
  try {
    if (sequelize) {
      return sequelize;
    }
    // const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = await getAzureSecrets();

    // if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
    //   throw new Error("One or more required database secrets are missing.");
    // }
    
    sequelize = new Sequelize(
      "certainty_local",
      "postgres",
      "Sumi@2271",
      {
        host: "localhost",
        dialect: "postgres",
        port: 5432,
        logging: env !== "production",
        define: {
          freezeTableName: true,
          timestamps: false,
        },
        // dialectOptions: {
        //   ssl: {
        //     require: true,
        //     rejectUnauthorized: false,
        //   },
        // },
      },
    );
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    return sequelize;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}
