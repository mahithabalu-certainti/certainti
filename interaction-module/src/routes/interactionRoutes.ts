import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

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

routes.post('/list', checkUserStatusMiddleware("NA"), controller.interactionsController.listAllInteractionPrjAcc)
routes.post('/export', checkUserStatusMiddleware("NA"), controller.interactionsController.exportAllInteractions)
routes.post('/globalList', checkUserStatusMiddleware("NA"), controller.interactionsController.listOutAllInteractionSummary)
routes.post('/globalList/export', checkUserStatusMiddleware("NA"), controller.interactionsController.exportAllInteractionSummary)
routes.post('/responseHistory/list', checkUserStatusMiddleware("NA"), controller.interactionsController.listResponseHistory)
routes.post('/responseHistory/export', checkUserStatusMiddleware("NA"), controller.interactionsController.exportResponseHistory)
routes.post('/history', checkUserStatusMiddleware("NA"), controller.interactionsController.listInteractionHistory)
const upload = multer(); // You can configure storage if needed

routes.post(
  "/uploadAttachment",
  checkUserStatusMiddleware("NA"),
  upload.single("file"), // 'file' is the field name for the uploaded file
  controller.interactionsController.uploadAttachmentToAzure
);
routes.delete(
  "/deleteAttachment",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.deleteAttachmentFromAzure
);
//routes.post("/new", checkUserStatusMiddleware("NA"), controller.interactionsController.createResource);
export default routes;
