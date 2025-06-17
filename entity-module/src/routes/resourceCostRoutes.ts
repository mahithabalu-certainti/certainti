import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", resourceCostController.resourceCosts);
routes.get("/export", checkUserStatusMiddleware("NA"), resourceCostController.exportResourceCosts);
routes.get("/list/:id", checkUserStatusMiddleware("account_resources_resource_cost_view"), resourceCostController.resourceCostById);
routes.post("/create", resourceCostController.createResourceCost);
routes.put("/duplicate/update", resourceCostController.acceptDuplicate);
routes.put("/anomaly/update", resourceCostController.acceptAnomaly);
routes.put("/update", checkUserStatusMiddleware("account_resources_resource_cost_edit_update"), resourceCostController.updateResourceCost);

export default routes;
