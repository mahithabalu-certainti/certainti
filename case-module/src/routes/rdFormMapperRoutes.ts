import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";
import multer from "multer";

const routes: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });
routes.post(
  "/generate",
  checkUserStatusMiddleware("NA"),
  controller.rdFormMapperController.processRdFormMapperRequests,
);
//routes.post("/rdForms/generate", checkUserStatusMiddleware("NA"), controller.rdFormMapperController.initiateRDFormFillerProcess);
routes.get(
  "/preview",
  checkUserStatusMiddleware("NA"),
  controller.rdFormMapperController.getRdFormMapperResults,
);
routes.post(
  "/signOff",
  checkUserStatusMiddleware("NA"),
  upload.single("file"),
  controller.rdFormMapperController.signOffRdForms,
);
export default routes;
