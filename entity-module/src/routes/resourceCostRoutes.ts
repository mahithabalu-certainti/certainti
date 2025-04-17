import { Router } from "express";
import resourceCostController from "../controllers/resourceCostController";

const routes: Router = Router();

routes.get("/list", resourceCostController.resourceCosts);
routes.get("/specific/:id", resourceCostController.resourceCostById);
routes.post("/create", resourceCostController.createResourceCost);
routes.put("/update", resourceCostController.updateResourceCost);

export default routes;
