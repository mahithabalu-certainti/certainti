import { Router } from 'express';
import controller from '../controllers';
import { checkUserStatusMiddleware } from '../middlewares/authMiddleware';
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router();

routes.get('/list', checkUserStatusMiddleware("accounts_view_edit"), controller.accountController.accounts);
routes.get('/listOrgAccounts', checkUserStatusMiddleware("accounts_view_edit"), controller.accountController.listOrgAccounts);
routes.get('/list/global',checkUserStatusMiddleware("NA"), controller.accountController.ListGlobalAccounts);
routes.get('/export', checkUserStatusMiddleware("accounts_export"), controller.accountController.exportAccounts);
routes.get('/global', checkUserStatusMiddleware("NA"), controller.accountController.globalAccounts);
routes.get('/country', checkUserStatusMiddleware("NA"), controller.geoDataController.country);
routes.get('/currency', checkUserStatusMiddleware("NA"), controller.geoDataController.currency);
routes.get('/regions', checkUserStatusMiddleware("NA"), controller.geoDataController.regions);
routes.get('/states', checkUserStatusMiddleware("NA"), controller.geoDataController.states);
routes.get('/cities', checkUserStatusMiddleware("NA"), controller.geoDataController.cities);
routes.get('/colors', checkUserStatusMiddleware("NA"), controller.geoDataController.colorCodes);

routes.get('/status', checkUserStatusMiddleware("NA"), controller.geoDataController.statusList);
routes.get('/resouceType', checkUserStatusMiddleware("NA"), controller.geoDataController.resourceType);
routes.get('/projectType', checkUserStatusMiddleware("NA"), controller.geoDataController.projectType);
routes.get('/skillLevel', checkUserStatusMiddleware("NA"), controller.geoDataController.skillLevel);
routes.get('/resourceStatus', checkUserStatusMiddleware("NA"), controller.geoDataController.resourceStatus);


routes.get('/list/:id', checkUserStatusMiddleware("accounts_view_edit"), controller.accountController.accountById);
routes.post('/new', checkUserStatusMiddleware("accounts_create"),upload.single('logo'), controller.accountController.createAccount);
routes.put('/update', checkUserStatusMiddleware("accounts_view_edit"),  upload.single('logo'),controller.accountController.updateAccount);
routes.get("/industry", checkUserStatusMiddleware("NA"), controller.geoDataController.industries);
routes.get("/keycontactroles", checkUserStatusMiddleware("NA"), controller.accountController.getKeyContactRoles);

export default routes;
