import express from 'express';
import cors from 'cors';
import requestLogger from '../middlewares/requestLoggerMiddleware';
import routes from '../routes/index';


interface Server {
    app: express.Application;
}

const initExpressServer = (): Server => {
   const app: express.Application = express();
   
   app.use(express.json()),
   app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
   );

   app.use(requestLogger);
   app.use('/api', routes);
   return {app};
}

export default initExpressServer;