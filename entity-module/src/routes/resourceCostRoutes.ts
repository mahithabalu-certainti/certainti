import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware, resourceCostController.resourceCosts);
routes.get("/export", checkUserStatusMiddleware, resourceCostController.exportResourceCosts);
routes.get("/list/:id", checkUserStatusMiddleware, resourceCostController.resourceCostById);
routes.post("/create", checkUserStatusMiddleware, resourceCostController.createResourceCost);
routes.put("/update", checkUserStatusMiddleware, resourceCostController.updateResourceCost);

export default routes;
