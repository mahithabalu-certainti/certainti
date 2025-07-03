import dotenv from 'dotenv';
import 'cross-fetch/polyfill';
dotenv.config(); 
import { initExpressServer } from './servers/expressServer';
import { initModels } from './models';
import initGraphQLServer from "./servers/graphqlServer";


const PORT: number = Number(process.env.SERVER_PORT) || 3000;

async function startServer() {
  try {
    await initModels();

    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);


    app.listen(PORT, () => {
      console.log(`Graphql Server ready at: ${graphqlPath}`);
      console.log(`Server running on port : ${PORT}`);
    });
  } catch (err) {
    console.log("error", err);
    if (err instanceof Error) {
      console.log("Error starting server", err.message);
    } else {
      console.log("Error starting server", err);
    }
  }
}

startServer();
