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
  controller.caseController.getCaseheadersDetails
 )

export default routes;