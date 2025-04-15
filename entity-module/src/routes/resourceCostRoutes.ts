import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";

const routes: Router = Router();
routes.get("/", resourceCostController.resourceCosts);
routes.get("/resourcecost/by/id", resourceCostController.resourceCostById);
routes.post("/create", resourceCostController.createResourceCost);
routes.put("/update", resourceCostController.updateResourceCost);

export default routes;
