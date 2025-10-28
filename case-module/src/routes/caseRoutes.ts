import { Router } from "express";
import controller from "../controllers";

//import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

const routes: Router = Router();
// routes.post(
//   "/new",
//   checkUserStatusMiddleware("interactions_create"),
//   controller.interactionsController.createInteraction
// );

export default routes;