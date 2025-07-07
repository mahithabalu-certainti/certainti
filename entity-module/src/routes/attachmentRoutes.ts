import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router();

routes.post("/upload/attachment", upload.single('logo'), controller.attachmentController.createAttachment);
routes.get("/list", controller.attachmentController.getAllAttachments);
routes.get("/document-type-category", controller.attachmentController.getDocumentTypeAndCategory);

export default routes;

