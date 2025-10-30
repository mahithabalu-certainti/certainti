import { Router } from "express";
import controller from "../controllers";


import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
 routes.post(
   "/new",
   checkUserStatusMiddleware("cases_create"),
   controller.caseController.createCases
 );
 routes.get(
  "/details/:accountRid/:caseRid",
  checkUserStatusMiddleware("NA"),
  controller.caseController.getCaseHeadersDetails
 )
 routes.put(
   "/update",
   checkUserStatusMiddleware("cases_view_edit"),
   controller.caseController.updateCases
 );
 routes.get(
  "/caseFilingType",
  checkUserStatusMiddleware("NA"),
  controller.caseController.getCaseFilingType
);
routes.get(
  "/caseStatus",
  checkUserStatusMiddleware("NA"),
  controller.caseController.getCaseStatus
);
routes.get('/list', checkUserStatusMiddleware("cases_view_edit"), controller.caseController.listAllCasesAccount)
routes.get('/export', checkUserStatusMiddleware("cases_export"), controller.caseController.exportAllCasesAccount)
routes.post(
  '/projects',
  checkUserStatusMiddleware("NA"),
  controller.caseController.fetchProjectForAssign
)
routes.post(
  '/projects/assign',
  checkUserStatusMiddleware("NA"),
  controller.caseController.assignProjectToCase
)

routes.post(
  '/assignedProjects',
  checkUserStatusMiddleware("NA"),
  controller.caseController.fetchAssignedprojects
)


export default routes;