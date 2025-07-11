import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router();

routes.post("/upload/attachment", checkUserStatusMiddleware("attachments_create"), upload.single('attachment'), controller.attachmentController.createAttachment);
routes.get("/list", checkUserStatusMiddleware("attachments_view_edit"), controller.attachmentController.getAllAttachments);
routes.get("/document-type-category", checkUserStatusMiddleware("NA"), controller.attachmentController.getDocumentTypeAndCategory);
routes.get("/list/summary",checkUserStatusMiddleware("attachments_view_edit"), controller.attachmentController.getAllAttachmentSummary);

export default routes;

