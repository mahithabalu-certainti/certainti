import { Router } from "express";
import resourceCostController from "../controllers/resourceCost";

const routes: Router = Router();
routes.get("/", resourceCostController.resourceCosts);
routes.post("/create", resourceCostController.createResourceCost);
routes.put("/update", resourceCostController.updateResourceCost);
routes.get("/get_resource_cost_by_id", resourceCostController.resourceCostById);

export default routes;
