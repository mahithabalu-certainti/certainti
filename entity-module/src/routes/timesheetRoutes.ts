import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.fetchAllImportList)
router.get('/list/:account_rid/:rid',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.importListByRid)
router.post('/list/export',
     checkUserStatusMiddleware('timesheet_export'),
      controller.importListController.exportAllImportedData)
router.get('/export/stagingFailure/:accountRid/:importRid/:entityType',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.exportStagingFailureList)
router.get('/export/loadFailure/:accountRid/:importRid/:entityType',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.exportLoadFailureList)
export default router;