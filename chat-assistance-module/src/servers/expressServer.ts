import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import routes from '../routes/index';
import { logMessage } from '../utils/logger';

const initExpressServer = async (): Promise<{ app: express.Application }> => {
  const app: express.Application = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    })
  );

  app.use('/api', routes);

  app.use((req, res) => {
    res.status(404).json({ status: 'FAILED', message: 'Route not found' });
  });

  logMessage('Express server initialized');
  return { app };
};

export default initExpressServer;
