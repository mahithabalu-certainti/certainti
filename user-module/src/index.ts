import dotenv from 'dotenv';
import 'cross-fetch/polyfill';
dotenv.config(); 
import { initExpressServer } from './servers/expressServer';
import { initModels } from './models';
import initGraphQLServer from "./servers/graphqlServer";
import { errorLog, logMessage } from './utils/helpers';


const PORT: number = Number(process.env.SERVER_PORT) || 3000;

async function startServer() {
  try {
    await initModels();

    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);


    app.listen(PORT, () => {
      logMessage(`Graphql Server ready at: ${graphqlPath}`);
      logMessage(`Server running on port : ${PORT}`);
    });
  } catch (err) {
    errorLog("Error starting server", (err as Error).message);
  }
}

startServer();
