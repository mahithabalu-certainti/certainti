import { Router } from "express";
import workflowRoutes from "./workflowRuleRoutes";

const router = Router();

router.use("/workflow", workflowRoutes);

export default router;
