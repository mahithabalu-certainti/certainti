import { Router } from 'express';
import controller from '../controllers';
import { checkUserStatusMiddleware } from '../middlewares/authMiddleware';

const routes: Router = Router();

routes.get('/list', checkUserStatusMiddleware, controller.accountController.accounts);
routes.get('/list/global',checkUserStatusMiddleware, controller.accountController.ListGlobalAccounts);
routes.get('/export', checkUserStatusMiddleware, controller.accountController.exportAccounts);
routes.get('/global', checkUserStatusMiddleware, controller.accountController.globalAccounts);
routes.get('/country', checkUserStatusMiddleware, controller.geoDataController.country);
routes.get('/currency', checkUserStatusMiddleware, controller.geoDataController.currency);
routes.get('/regions', checkUserStatusMiddleware, controller.geoDataController.regions);
routes.get('/states/:countryId', checkUserStatusMiddleware, controller.geoDataController.states);
routes.get('/cities/:stateId', checkUserStatusMiddleware, controller.geoDataController.cities);
routes.get('/list/:id', checkUserStatusMiddleware, controller.accountController.accountById);
routes.post('/new', checkUserStatusMiddleware, controller.accountController.createAccount);
routes.put('/update', checkUserStatusMiddleware, controller.accountController.updateAccount);

export default routes;
