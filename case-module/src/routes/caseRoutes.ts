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

export default routes;