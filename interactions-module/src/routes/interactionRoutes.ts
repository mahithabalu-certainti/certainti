import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post(
  "/new",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.createInteraction
);
routes.put(
  "/update",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.updateInteraction
);
routes.put(
  "/updateResponse",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.updateInteractionResponse
);
routes.get(
  "/detail/:accountId/:interactionRid",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionDetailsById
);
routes.get(
  "/questionsInfo/:accountId/:interactionRid",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionQuestionsById
);
routes.get(
  "/interactionStatus",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionStatus
);
routes.get(
  "/interactionTypes",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionTypes
);
routes.get(
  "/interactionSource",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionSource
);

routes.post('/list', controller.interactionsController.listAllInteractionPrjAcc)
routes.post('/export', controller.interactionsController.exportAllInteractions)
routes.post('/globalList', controller.interactionsController.listOutAllInteractionSummary)
routes.post('/globalList/export', controller.interactionsController.exportAllInteractionSummary)
routes.post('/responseHistory/list', controller.interactionsController.listResponseHistory)
routes.post('/responseHistory/export', controller.interactionsController.exportResponseHistory)

//routes.post("/new", checkUserStatusMiddleware("NA"), controller.interactionsController.createResource);
export default routes;
