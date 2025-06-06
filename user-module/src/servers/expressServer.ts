import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import routes from "../routes";
import requestLogger from "../middlewares/requestLogger";
import { rateLimiter } from "../utils/rateLimiter";

export const initExpressServer = (): { app: Express } => {
  const app: Express = express();
// Increase the request body limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use(express.json());

  const corsOptions: CorsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };

  app.use(cors(corsOptions));

  app.use(requestLogger);

  app.use("/api", rateLimiter);

  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      res.status(408).json({ status: "error", message: "Request timed out" });
    });
    next();
  });

  app.use("/api", routes);

  return { app };
};
