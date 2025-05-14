import express from 'express';
import cors from 'cors';
import requestLogger from '../middlewares/requestLoggerMiddleware';
import routes from '../routes/index';
import { RedisService } from '../services/redisService';

interface Server {
    app: express.Application;
}

const initExpressServer = async (): Promise<Server> => {
   const app: express.Application = express();
   
   app.use(express.json()),
   app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
   );

//    const redis = new RedisService();
//    await redis.connect();

   app.use(requestLogger);
   app.use('/api', routes);
   return {app};
}

export default initExpressServer;