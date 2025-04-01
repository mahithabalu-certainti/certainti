import express, { Express } from "express";
import cors, { CorsOptions } from "cors";
import routes from "./routes";
import requestLogger from "./middlewares/requestLogger";

export const initExpressServer = (): { app: Express } => {
  const app: Express = express();

  app.use(express.json());

  const corsOptions: CorsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };

  app.use(cors(corsOptions));

  app.use(requestLogger);

  app.use("/api", routes);

  return { app };
};
