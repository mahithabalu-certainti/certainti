import dotenv from "dotenv";
dotenv.config();
import { initModels } from "./models";
import initExpressServer from "./servers/expressServer";
import initGraphQLServer from "./servers/graphqlServer";
import { logMessage } from "./utils/helpers";

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    await initModels();
    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);

    app.listen(PORT, () => {
      logMessage(`Graphql Server ready at: ${graphqlPath}`);
      logMessage(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    logMessage(`Error starting server: ${err.message}`);
  }
}

startServer();
