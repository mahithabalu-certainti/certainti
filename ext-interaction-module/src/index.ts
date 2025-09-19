import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    const { app } = await initExpressServer();

    app.listen(PORT, () => {
      console.log(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    console.log("Error starting server", err.message);
  }
}

startServer();
