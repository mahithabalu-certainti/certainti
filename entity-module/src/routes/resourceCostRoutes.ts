import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const routes: Router = Router();

routes.get("/list", checkUserStatusMiddleware("account_resource_cost_edit_view"), resourceCostController.resourceCosts);
routes.get("/export", checkUserStatusMiddleware("account_resources_cost_export"), resourceCostController.exportResourceCosts);
routes.get("/list/:id", checkUserStatusMiddleware("account_resource_cost_edit_view"), resourceCostController.resourceCostById);
routes.post("/create", checkUserStatusMiddleware("account_resources_cost_create"), resourceCostController.createResourceCost);
routes.put("/status/update", checkUserStatusMiddleware("account_resource_cost_edit_view"), resourceCostController.acceptStatus);
routes.put("/update", checkUserStatusMiddleware("account_resource_cost_edit_view"), resourceCostController.updateResourceCost);
routes.get("/financial-highlights/list", checkUserStatusMiddleware("account_resource_cost_edit_view"), resourceCostController.resourceCostsForFinancialHighlights);
routes.get("/financial-highlights/export", checkUserStatusMiddleware("account_resources_cost_export"), resourceCostController.exportResourceCostsForFinancialHighlights);

export default routes;
