import { Router } from "express";
import controller from "../controllers";

import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

const routes: Router = Router();

routes.post(
  "/new",
  checkUserStatusMiddleware("interactions_create"),
  controller.interactionsController.createInteraction
);
routes.put(
  "/update",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.updateInteraction
);
routes.put(
  "/updateResponse",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.updateInteractionResponse
);
routes.get(
  "/detail/:accountId/:interactionRid",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.getInteractionDetailsById
);
routes.get(
  "/case/keyContact",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getKeyContactsByCaseId
);
routes.get(
  "/questionsInfo/:accountId/:interactionRid",
  checkUserStatusMiddleware("interactions_view_edit"),
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
  "/interactionLevel",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionLevel
);
routes.get(
  "/interactionSource",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getInteractionSource
);
routes.get(
  "/responseSource",
  checkUserStatusMiddleware("NA"),
  controller.interactionsController.getResponseSource
);
routes.put(
  "/accountInterctions/update",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.updateAccountInteraction
);

routes.get('/technicalSummary/list', checkUserStatusMiddleware("projects_tech_summary_view_edit"), controller.interactionsController.listTechnicalSummary)
routes.get('/technicalSummary/details', checkUserStatusMiddleware("projects_tech_summary_view_edit"), controller.interactionsController.getTechnicalSummaryDetailsById)
routes.put(
  "/technicalSummary/update",
  checkUserStatusMiddleware("projects_tech_summary_view_edit"),
  controller.interactionsController.updateTechSummaryContext
);
routes.post(
  "/accountInterctions/create",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.createAccountInteraction
);  


routes.get('/technicalSummary/export', checkUserStatusMiddleware("projects_tech_summary_export"), controller.interactionsController.exportTechnicalSummary)
routes.post('/list', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.listAllInteractionPrjAcc)
routes.post('/export', checkUserStatusMiddleware("interactions_export"), controller.interactionsController.exportAllInteractions)
routes.post('/globalList', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.listOutAllInteractionSummary)
routes.post('/globalList/export', checkUserStatusMiddleware("interactions_export"), controller.interactionsController.exportAllInteractionSummary)
routes.post('/responseHistory/list', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.listResponseHistory)
routes.post('/responseHistory/export', checkUserStatusMiddleware("interactions_export"), controller.interactionsController.exportResponseHistory)
routes.post('/history', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.listInteractionHistory)
routes.post('/attachments', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.fetchInteractionAttachments)
routes.post('/responseHistory/details', checkUserStatusMiddleware('interactions_view_edit'), controller.interactionsController.fetchResponseHistoryDetails)
routes.post('/triggerAi', checkUserStatusMiddleware("trigger_ai_assessment"), controller.interactionsController.triggerAIAndPassResponse)
routes.post('/history/export', checkUserStatusMiddleware("interactions_export"), controller.interactionsController.exportInteractionHistory)
routes.post('/list/reminder', checkUserStatusMiddleware("interactions_view_edit"), controller.interactionsController.fetchInteractionListForReminder)
const upload = multer(); // You can configure storage if needed

routes.post(
  "/uploadAttachment",
  checkUserStatusMiddleware("interactions_view_edit"),
  upload.single("file"), // 'file' is the field name for the uploaded file
  controller.interactionsController.uploadAttachmentToAzure
);
routes.delete(
  "/deleteAttachment",
  checkUserStatusMiddleware("interactions_view_edit"),
  controller.interactionsController.deleteAttachmentFromAzure
);

routes.post("/sendInteraction",
  checkUserStatusMiddleware("send_interactions"),
  controller.interactionsController.sendInteraction
);
//routes.post("/new", checkUserStatusMiddleware("NA"), controller.interactionsController.createResource);
export default routes;
