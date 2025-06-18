import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware("account_resources_resource_cost_view"), resourceCostController.resourceCosts);
routes.get("/export", checkUserStatusMiddleware("NA"), resourceCostController.exportResourceCosts);
routes.get("/list/:id", checkUserStatusMiddleware("account_resources_resource_cost_view"), resourceCostController.resourceCostById);
routes.post("/create", checkUserStatusMiddleware("account_resources_cost_create"), resourceCostController.createResourceCost);
routes.put("/status/update", checkUserStatusMiddleware("NA"), resourceCostController.acceptStatus);
routes.put("/update", checkUserStatusMiddleware("account_resources_resource_cost_edit_update"), resourceCostController.updateResourceCost);

export default routes;
