import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();
const upload = multer({storage : multer.memoryStorage()})
routes.post(
  "/task/create",
  checkUserStatusMiddleware("NA"),
  controller.activitiesController.createActivityTask
);

export default routes;