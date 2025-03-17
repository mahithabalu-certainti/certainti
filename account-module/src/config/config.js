const winston = require("winston");
const { transports, createLogger, format } = winston;
const sequelize = require("./dataSource");
const Services = require("../services");

/**
 * @class Configurations
 * @classdesc Manages application-wide configurations, including database settings,
 * logger instances, and service initializations. Uses the Singleton pattern to ensure
 * only one instance of configurations exists throughout the application.
 */
class Configurations {
  static instance;
  dbConfig;
  logger;
  services;

  constructor() {
    this.dbConfig = sequelize;

    this.logger = createLogger({
      level: "info",
      format: format.combine(format.timestamp(), format.json()),
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
  static getInstance() {
    if (!Configurations.instance) {
      Configurations.instance = new Configurations();
    }
    return Configurations.instance;
  }

  /**
   * @function getDbConfig
   * @description Returns the database configuration object.
   * @returns {any} - The TypeORM DataSource configuration.
   */
  getDbConfig() {
    return this.dbConfig;
  }

  initDb() {
    return this.dbConfig.sync({ force: true }).then(async () => {
      console.log("Database synced!");
    });
  }

  /**
   * @function getServices
   * @description Returns the Services instance.
   * @returns {Services} - The Services instance.
   */
  getServices() {
    return this.services;
  }

  /**
   * @function getLogger
   * @description Returns the Winston logger instance.
   * @returns {Logger} - The Winston logger.
   */
  getLogger() {
    return this.logger;
  }
}

module.exports = Configurations;
