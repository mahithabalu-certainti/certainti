import { Router } from "express";
import controller from "../controllers";

const routes: Router = Router();

routes.post(
  "/webhook",
  controller.webhookController.handleWehook
);

export default routes;
