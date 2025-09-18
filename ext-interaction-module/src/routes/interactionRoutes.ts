import { Router } from "express";
import multer from "multer";
import controller from "../controllers";

const routes: Router = Router();
const upload = multer();

routes.put(
  "/updateResponse",
  controller.interactionsController.updateInteractionResponse
);
routes.get(
  "/detail/:accountId/:interactionRid",
  controller.interactionsController.getInteractionDetailsById
);
routes.post(
  "/uploadAttachment",
  upload.single("file"),
  controller.interactionsController.uploadAttachmentToAzure
);
routes.delete(
  "/deleteAttachment",
  controller.interactionsController.deleteAttachmentFromAzure
);

export default routes;