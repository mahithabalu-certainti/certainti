import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
import initGraphQLServer from "./servers/graphqlServer";
import { errorLog, logMessage } from "./utils/helpers";
import "./utils/cronScheduler";

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);

    app.listen(PORT, () => {
      logMessage(`Graphql Server ready at: ${graphqlPath}`);
      logMessage(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    errorLog("Error starting server", (err as Error).message);
  }
}

startServer();
