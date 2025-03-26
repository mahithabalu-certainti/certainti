import { Router } from 'express';
import controller from '../controllers';

const routes: Router = Router();

routes.get('/', controller.accountController.accounts);
routes.post('/new', controller.accountController.createAccount);
routes.post('/update', controller.accountController.updateAccount);

export default routes;
