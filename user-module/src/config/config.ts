import { createLogger, transports, format, Logger } from "winston";
import sequelize from "./dataSource";
import Services from "../services";
import { NODE_ENV } from "../utils/constant";

/**
 * @class Configurations
 * @classdesc Manages application-wide configurations, including database settings,
 * logger instances, and service initializations. Uses the Singleton pattern to ensure
 * only one instance of configurations exists throughout the application.
 */
class Configurations {
  private static instance: Configurations;
  private dbConfig: any; // Type it as needed for sequelize instance
  private logger: Logger;
  private services: Services;

  private constructor() {
    this.dbConfig = sequelize;

    this.logger = createLogger({
      level: process.env.NODE_ENV === NODE_ENV.DEV ? "info" : "debug",
      format: format.combine(
        format.colorize({ level: true }),
        format.timestamp(),
        format.printf(({ timestamp, level, message, method, url }) => {
          return `[${level}] -> ${message} ${method} ${url ? `| ${url}` : ""} ${
            timestamp ? `| ${timestamp}` : ""
          }`;
        })
      ),
      transports: [new transports.Console()],
    });

    this.services = new Services();
  }

  /**
   * @static
   * @function getInstance
   * @description Returns the singleton instance of the Configurations class.
   * If no instance exists, it creates one before returning.
   * @returns {Configurations} - The singleton instance of Configurations.
   */
  public static getInstance(): Configurations {
    if (!Configurations.instance) {
      Configurations.instance = new Configurations();
    }
    return Configurations.instance;
  }

  /**
   * @function getDbConfig
   * @description Returns the database configuration object.
   * @returns {any} - The Sequelize configuration.
   */
  public getDbConfig(): any {
    return this.dbConfig;
  }

  /**
   * @function initDb
   * @description Initializes the database connection and syncs it.
   * @returns {Promise<void>} - Resolves once the database is synced.
   */
  public async initDb(): Promise<void> {
    try {
      const forceSync = process.env.NODE_ENV !== NODE_ENV.PROD;
      await this.dbConfig.sync({ force: forceSync });
      if (forceSync) {
        this.logger.info(
          "Database synced with force: true (non-production environment)."
        );
      } else {
        this.logger.info("Database synced successfully.");
      }
    } catch (err) {
      this.logger.error(
        `Error syncing the database: ${(err as Error).message}`
      );
      throw new Error(`Database sync failed: ${(err as Error).message}`);
    }
  }

  /**
   * @function getServices
   * @description Returns the Services instance.
   * @returns {Services} - The Services instance.
   */
  public getServices(): Services {
    return this.services;
  }

  /**
   * @function getLogger
   * @description Returns the Winston logger instance.
   * @returns {Logger} - The Winston logger.
   */
  public getLogger(): Logger {
    return this.logger;
  }
}

export default Configurations;
