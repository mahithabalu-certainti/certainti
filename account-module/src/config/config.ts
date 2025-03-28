import { createLogger, transports, format, Logger } from "winston";
import sequelize from "./dataSource";
import Services from "../services";

/**
 * @class Configurations
 * @classdesc Manages application-wide configurations, including database settings,
 * logger instances, and service initializations. Uses the Singleton pattern to ensure
 * only one instance of configurations exists throughout the application.
 */
class Configurations {
  private static instance: Configurations | null = null;
  private dbConfig: typeof sequelize;
  private logger: Logger;
  private services: Services;

  private constructor() {
    this.dbConfig = sequelize;
    this.services = new Services();

    this.logger = createLogger({
      level: "info",
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
   * @returns {any} - The Sequelize instance (dbConfig).
   */
  public getDbConfig(): typeof sequelize {
    return this.dbConfig;
  }

  /**
   * @function initDb
   * @description Initializes and syncs the database.
   * @returns {Promise<void>} - A promise that resolves once the database is synced.
   */
  public initDb(): Promise<void> {
    return this.dbConfig.sync({ force: true }).then(() => {
      console.log("Database synced!");
    });
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
