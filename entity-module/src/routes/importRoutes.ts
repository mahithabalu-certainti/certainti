import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllImportList)
router.get('/list/:account_rid/:rid', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.importListByRid)
router.get('/list/staging-failure/:account_rid/:import_rid/:entity_type', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllStagingFailureList)
router.get('/list/load-failure/:account_rid/:import_rid/:entity_type', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllLoadFailureList)
export default router