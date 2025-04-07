import dotenv from 'dotenv';
dotenv.config(); 
import { initExpressServer } from './expressServer';
import { initModels } from './models';


const PORT: number = Number(process.env.SERVER_PORT) || 3000;

async function startServer() {
  try {
    await initModels();

    const { app } = await initExpressServer();

    app.listen(PORT, () => {
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
