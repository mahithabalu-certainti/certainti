import { Sequelize } from "sequelize";
import { NODE_ENV } from "../utils/constants";
import { getSecret } from "../utils/azureSecrets";
import { logMessage } from "../utils/helpers";

let sequelize: Sequelize;

const requiredEnvVariables = [
  "ORGDB_NAME",
  "ORGDB_PASSWORD",
  "ORGDB_USERNAME",
  "ORGDB_ENDPOINT",
];

requiredEnvVariables.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
});

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
      getSecret(process.env.ORGDB_NAME as string),
      getSecret(process.env.ORGDB_USERNAME as string),
      getSecret(process.env.ORGDB_PASSWORD as string),
      getSecret(process.env.ORGDB_ENDPOINT as string),
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

export async function initOrgSequelize() {
  try {
    if (sequelize) {
      return sequelize;
    }
// const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = await getAzureSecrets();
    // if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
    //   throw new Error("One or more required database secrets are missing.");
    // }
sequelize = new Sequelize("thinkrd365_org", "adminUser", "ip=T6gY5FXAVvgFl", {
      host: "development-thinkrd365-psqlserver-centralus-org.postgres.database.azure.com",
      dialect: "postgres",
      port: 5432,
      logging: env !== "production",
      define: {
        freezeTableName: true,
        timestamps: false,
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    });
    await sequelize.authenticate();
    logMessage("Database connection established successfully.");
    return sequelize;
  } catch (error) {
    logMessage(`Unable to connect to the database: ${error}`);
    process.exit(1);
  }
}
