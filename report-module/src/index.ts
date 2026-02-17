import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
import { logMessage } from "./utils/helpers";
import { initModels } from "./models";

const PORT = process.env.SERVER_PORT || 5012;

async function startServer() {
    try {
        await initModels();
        logMessage("Models Initialized");

        const { app } = await initExpressServer();

        app.listen(PORT, () => {
            logMessage(`Server running on port : ${PORT}`);
        });
    } catch (err: any) {
        logMessage(`Error starting server: ${err.message}`);
    }
}

startServer();
