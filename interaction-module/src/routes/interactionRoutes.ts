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
  "/mailbox/folders",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.listMailboxFolders
);
routes.get(
  "/mailbox/messages",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.listMailboxMessages
);
routes.get(
  "/mailbox/inbox",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.listInboxMessages
);
routes.get(
  "/mailbox/messages/attachments",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.getMailboxAttachmentById
);
routes.get(
  "/mailbox/messages/:messageId",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.getMailboxMessageById
);
routes.get(
  "/calendar/metadata",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.getCalendarMetadata
);
routes.get(
  "/calendar/events",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.listCalendarEvents
);
routes.get(
  "/calendar/events/:eventId",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.getCalendarEventById
);
routes.post(
  "/calendar/events/:eventId/cancel",
  checkUserStatusMiddleware("accounts_view_edit"),
  controller.interactionsController.cancelCalendarEvent
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
  "/refineSummary",
  checkUserStatusMiddleware("projects_tech_summary_view_edit"),
  controller.interactionsController.refineSummary
);
routes.post(
  "/refineSummary/save",
  checkUserStatusMiddleware("projects_tech_summary_view_edit"),
  controller.interactionsController.saveRefineSummary
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
routes.post('/fourPartAssessment/list', checkUserStatusMiddleware("four_part_assessment_view_edit"), controller.interactionsController.fetchFourPartAssessmentList)
routes.post('/fourPartAssessment/details', checkUserStatusMiddleware('four_part_assessment_view_edit'), controller.interactionsController.getFpaDetails)
routes.post('/fourPartAssessment/export', checkUserStatusMiddleware("four_part_assessment_export"), controller.interactionsController.exportFetchFourPartAssessmentList)
routes.post('/fourPartAssessment/update', checkUserStatusMiddleware("NA"), controller.interactionsController.updateInteractionStatus)
routes.get("/assessmentSource", checkUserStatusMiddleware("NA"), controller.interactionsController.getInteractionAssessmentSource)

routes.post('/rdAssessmentAudit/list', checkUserStatusMiddleware("rd_assessment_status_view"), controller.interactionsController.listAiAssessmentAudit)
routes.post('/rdAssessmentAudit/export', checkUserStatusMiddleware("rd_assessment_status_export"), controller.interactionsController.exportAiAssessmentAudit)

export default routes;
