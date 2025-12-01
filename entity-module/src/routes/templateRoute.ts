import { Router } from "express";
import multer from "multer";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get(
  "/list",
  checkUserStatusMiddleware("NA"),
  controller.templateController.listTemplates
);
router.post(
  "/upload",
  checkUserStatusMiddleware("NA"),
  upload.single('file'),
  controller.templateController.uploadTemplate
);

export default router;
