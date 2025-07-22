import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllImportList)
router.get('/list/:account_rid/:rid', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.importListByRid)
router.post('/list/export', checkUserStatusMiddleware('imports_export'), controller.importListController.exportAllImportedData)
router.get('/export/:account_rid/:rid', checkUserStatusMiddleware('imports_export'), controller.importListController.exportImportListPerRow)
router.post('/list/export/staging-failure/:account_rid/:import_rid/:entity_type', checkUserStatusMiddleware('imports_export'), controller.importListController.exportStagingFailureList)
router.post('/list/export/load-failure/:account_rid/:import_rid/:entity_type', checkUserStatusMiddleware('imports_export'), controller.importListController.exportLoadFailureList)
export default router