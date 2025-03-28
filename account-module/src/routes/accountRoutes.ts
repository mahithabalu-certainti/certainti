import { Router } from 'express';
import controller from '../controllers';

const routes: Router = Router();

routes.get('/', controller.accountController.accounts);
routes.get('/global', controller.accountController.globalAccounts);
routes.get('/country', controller.geoDataController.country);
routes.get('/currency', controller.geoDataController.currency);
routes.get('/regions', controller.geoDataController.regions);
routes.get('/:id', controller.accountController.accountById);
routes.post('/new', controller.accountController.createAccount);
routes.put('/update', controller.accountController.updateAccount);

export default routes;
