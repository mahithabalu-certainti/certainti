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


export default routes;