import { Router } from "express";
import resourceCostRoutes from './resourceCostRoutes';

const routes:Router=Router();

routes.use("/resource_cost", resourceCostRoutes);

export default routes;
