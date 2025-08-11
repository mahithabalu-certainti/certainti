import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

//routes.post("/new", checkUserStatusMiddleware("NA"), controller.interactionsController.createResource);
export default routes;