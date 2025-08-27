import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.fetchAllImportList)
router.get('/list/:accountRid/:rid',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.importListByRid)
router.post('/list/export',
     checkUserStatusMiddleware('timesheet_export'),
(req, res, next) => {
    req.body.permissionModule = 'timesheet_view_edit'; // Pass specific module
    next();
  },          
      controller.importListController.exportAllImportedData)
router.get('/export/stagingFailure/:accountRid/:importRid/:entityType',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.exportStagingFailureList)
router.get('/export/loadFailure/:accountRid/:importRid/:entityType',
     checkUserStatusMiddleware('timesheet_view_edit'),
      controller.importListController.exportLoadFailureList)
router.get('/importedProjects/:accountId',
     checkUserStatusMiddleware('projects_view_edit'),
       controller.importListController.importedAccountLevelprojectList)
router.get('/importedResources/:accountId',
     checkUserStatusMiddleware('account_resources_view_edit'),
       controller.importListController.importedAccountLevelresourceList)
router.get('/importedProjectTasks/:accountId',
     checkUserStatusMiddleware('projects_task_view_edit'),
       controller.importListController.importedAccountLevelProjectTaskList)
router.get('/export/importedProjects/:accountId',
     checkUserStatusMiddleware('projects_export'),
       controller.importListController.exportImportedProjectList)
router.get('/export/importedResources/:accountId',
     checkUserStatusMiddleware('account_resources_export'),
       controller.importListController.exportImportedResourceList);
router.get('/export/importedProjectTasks/:accountId',
     checkUserStatusMiddleware('projects_task_export'),
       controller.importListController.exportImportedProjectTaskList);                               
export default router;