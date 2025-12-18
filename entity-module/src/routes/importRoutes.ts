import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllImportList)
router.get('/list/:accountRid/:rid', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.importListByRid)
router.post('/list/export', checkUserStatusMiddleware('imports_export'),
(req, res, next) => {
    req.body.permissionModule = 'imports_view_edit'; // Pass specific module
    next();
  }, 
controller.importListController.exportAllImportedData)
router.get('/export/stagingFailure/:accountRid/:importRid/:entityType', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.exportStagingFailureList)
router.get('/export/loadFailure/:accountRid/:importRid/:entityType', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.exportLoadFailureList)
router.get('/export/warnings/:accountRid/:importRid/:entityType', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.exportAllWarningList)
export default router
