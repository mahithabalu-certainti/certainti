import { Router } from "express";
import controller from "../controllers";


import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
 routes.post(
   "/new",
   checkUserStatusMiddleware("NA"),
   controller.caseController.createCases
 );
 routes.get(
  "/details/:accountRid/:caseRid",
  checkUserStatusMiddleware("NA"),
  controller.caseController.getCaseHeadersDetails
 )
 routes.put(
   "/update",
   checkUserStatusMiddleware("NA"),
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
routes.post(
  '/projects',
  checkUserStatusMiddleware("NA"),
  controller.caseController.fetchProjectForAssign
)


export default routes;