import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { createServer } from "http";
import requestLogger from "../middlewares/requestLoggerMiddleware";
import routes from "../routes/index";
import WebSocketManager from "../services/webSocketManager";

interface Server {
  app: express.Application;
  server: import("http").Server;
}

const initExpressServer = async (): Promise<Server> => {
  const app: express.Application = express();
  const server = createServer(app);

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

  // Initialize WebSocket server
  const wsManager = WebSocketManager.getInstance();
  wsManager.initialize(server);

  return { app, server };
};

export default initExpressServer;
