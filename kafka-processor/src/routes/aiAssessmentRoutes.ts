import { Router } from "express";
import controller from "../controllers";

const routes: Router = Router();
 routes.put(
  "/updateResponse",
   controller.aiAssessmentController.sendAIResponseToTopic
 );
export default routes;