import { Router } from 'express';
import controller from '../controllers';
import { checkUserStatusMiddleware } from '../middlewares/authMiddleware';

const routes: Router = Router();

routes.get('/list', checkUserStatusMiddleware("accounts_view_all"), controller.accountController.accounts);
routes.get('/list/global',checkUserStatusMiddleware("NA"), controller.accountController.ListGlobalAccounts);
routes.get('/export', checkUserStatusMiddleware("accounts_export"), controller.accountController.exportAccounts);
routes.get('/global', checkUserStatusMiddleware("NA"), controller.accountController.globalAccounts);
routes.get('/country', checkUserStatusMiddleware("NA"), controller.geoDataController.country);
routes.get('/currency', checkUserStatusMiddleware("NA"), controller.geoDataController.currency);
routes.get('/regions', checkUserStatusMiddleware("NA"), controller.geoDataController.regions);
routes.get('/states', checkUserStatusMiddleware("NA"), controller.geoDataController.states);
routes.get('/cities', checkUserStatusMiddleware("NA"), controller.geoDataController.cities);
routes.get('/list/:id', checkUserStatusMiddleware("account_details_view"), controller.accountController.accountById);
routes.post('/new', checkUserStatusMiddleware("accounts_create"), controller.accountController.createAccount);
routes.put('/update', checkUserStatusMiddleware("accounts_edit_update"), controller.accountController.updateAccount);
routes.get("/industry", checkUserStatusMiddleware("NA"), controller.geoDataController.industries);
routes.get("/keycontactroles", checkUserStatusMiddleware("NA"), controller.accountController.getKeyContactRoles);

export default routes;
