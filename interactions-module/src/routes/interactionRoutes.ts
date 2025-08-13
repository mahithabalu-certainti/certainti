import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post('/list', controller.interactionsController.listAllInteractionPrjAcc)
routes.post('/export', controller.interactionsController.exportAllInteractions)
routes.post('/globalList', controller.interactionsController.listOutAllInteractionSummary)
routes.post('/globalList/export', controller.interactionsController.exportAllInteractionSummary)
routes.post('/responseHistory/list', controller.interactionsController.listResponseHistory)
routes.post('/responseHistory/export', controller.interactionsController.exportResponseHistory)

//routes.post("/new", checkUserStatusMiddleware("NA"), controller.interactionsController.createResource);
export default routes;