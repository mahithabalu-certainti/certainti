import { Router } from 'express';
import chatRoutes from './chatRoutes';

const routes = Router();

routes.get('/health', (req, res) => res.status(200).send('OK'));

routes.use('/chat', chatRoutes);

export default routes;
