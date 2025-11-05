import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
routes.post(
  "/adminChecklist/create",
  checkUserStatusMiddleware("checklist_templates_create"),
  controller.caseManagementController.createAdminCheckList
);
routes.get(
  "/adminChecklist/list",
  checkUserStatusMiddleware("checklist_templates_view_edit"),
  controller.caseManagementController.listAdminCheckList
);
routes.get(
  "/adminChecklist/export",
  checkUserStatusMiddleware("checklist_templates_export"),
  controller.caseManagementController.exportAdminCheckList
);
routes.get(
  "/adminChecklist/detail/:checkListRid",
  checkUserStatusMiddleware("checklist_templates_view_edit"),
  controller.caseManagementController.getCheckListTemplateDetailsById
);
routes.post(
  "/taskTemplate/create",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.createTaskTemplate
);
routes.get(
  "/priority",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getPriorityTypes
)
routes.get(
  "/caseMilestones",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getMilestones
)
routes.get(
  "/checklist",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.getChecklist
)
routes.put(
  "/taskTemplate/update",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.updateTaskTemplate
);
routes.post(
  "/taskTemplate/list",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.fetchAdminTaskTemplateList
);
routes.post(
  "/taskTemplate/export",
  checkUserStatusMiddleware("NA"),
  controller.caseManagementController.ExportAdminTaskTemplateList
);


export default routes;
