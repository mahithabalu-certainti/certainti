import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import requestLogger from "../middlewares/requestLoggerMiddleware";
import routes from "../routes/index";
interface Server {
  app: express.Application;
}

const initExpressServer = async (): Promise<Server> => {
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
  app.use("/api", routes);
  return { app };
};

export default initExpressServer;
