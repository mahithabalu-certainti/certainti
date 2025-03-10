const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.routes");
const authMiddleware = require("./middlewares/authMiddleware");

const initExpressServer = async () => {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
  app.use(authMiddleware);
  
  app.use("/api", routes);

  return { app };
};

module.exports = initExpressServer;
