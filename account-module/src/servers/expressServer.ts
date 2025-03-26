import express from 'express';
import cors from 'cors';
import routes from '../routes';
import authMiddleware from '../middlewares/authMiddleware';

interface Server {
  app: express.Application;
}

const initExpressServer = (): Server => {
  const app: express.Application = express();

  app.use(express.json());
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  );
  app.use(authMiddleware);

  app.use('/api', routes);

  return { app };
};

export default initExpressServer;
