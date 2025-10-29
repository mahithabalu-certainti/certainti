import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
import { logMessage } from "./utils/helpers";

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    const { app } = await initExpressServer();

    app.listen(PORT, () => {
     logMessage(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    logMessage(`Error starting server: ${err.message}`);
  }
}

startServer();
