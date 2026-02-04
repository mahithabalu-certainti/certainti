import { createLogger, transports, format, Logger } from "winston";
import Services from "../services";
import { NODE_ENV } from "../utils/constants";

/**
 * @class Configurations
 */
class Configurations {
    private static instance: Configurations | null = null;
    private logger: Logger;
    private services: Services;

    private constructor() {

        this.logger = createLogger({
            level: process.env.NODE_ENV === NODE_ENV.DEV ? "info" : "debug",
            format: format.combine(
                format.colorize({ level: true }),
                format.timestamp(),
                format.printf(({ timestamp, level, message, method, url }) => {
                    return `[${level}] -> ${message} ${method ? method : ''} ${url ? `| ${url}` : ""} ${timestamp ? `| ${timestamp}` : ""
                        }`;
                })
            ),
            transports: [new transports.Console()],
        });

        this.services = new Services(this.logger);
    }

    public static getInstance(): Configurations {
        if (!Configurations.instance) {
            Configurations.instance = new Configurations();
        }
        return Configurations.instance;
    }

    public getServices(): Services {
        return this.services;
    }

    public getLogger(): Logger {
        return this.logger;
    }
}

export default Configurations;
