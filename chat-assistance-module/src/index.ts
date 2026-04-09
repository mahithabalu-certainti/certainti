import dotenv from 'dotenv';
dotenv.config();

import initExpressServer from './servers/expressServer';
import { logMessage } from './utils/logger';

const PORT = process.env.SERVER_PORT || 5014;

async function startServer() {
  try {
    const { app } = await initExpressServer();

    app.listen(PORT, () => {
      logMessage(`Chat Assistance Module running on port ${PORT}`);
      logMessage(`Health check: http://localhost:${PORT}/api/health`);
      logMessage(`Chat endpoint: POST http://localhost:${PORT}/api/chat/message`);
    });
  } catch (err: any) {
    logMessage(`Error starting server: ${err.message}`);
    process.exit(1);
  }
}

startServer();
