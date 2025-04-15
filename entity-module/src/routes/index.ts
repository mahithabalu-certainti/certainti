import { Router } from "express";
import resourceCostRoutes from './resourceCostRoutes';
import resourceRoutes from "./resourceRoutes";

const routes:Router=Router();

routes.use("/resources", resourceRoutes);
routes.use("/resource_cost", resourceCostRoutes);

export default routes;
