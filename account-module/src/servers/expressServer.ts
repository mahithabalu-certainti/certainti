import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import routes from "../routes";
import requestLogger from "../middlewares/requestLoggerMiddleware";
import { rateLimiter } from "../utils/rateLimiter";

interface Server {
  app: express.Application;
}

const initExpressServer = (): Server => {
  const app: express.Application = express();

  app.use(helmet());

  app.use(compression());

  app.use(express.json({ limit: "50mb" }));

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
  app.use(requestLogger);

  app.use("/api", rateLimiter);

  app.use((req, res, next) => {
    res.setTimeout(60000, () => {
      res.status(408).json({ status: "error", message: "Request timed out" });
    });
    next();
  });

  app.use("/api", routes);

  return { app };
};

export default initExpressServer;
