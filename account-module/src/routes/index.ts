import { Router } from 'express';
import accountRoutes from './accountRoutes';

const routes: Router = Router();

routes.use('/accounts', accountRoutes);

export default routes;
