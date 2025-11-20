import { Router } from "express";
import caseRoutes from "./caseRoutes";
import taskRoutes from "./taskRoutes";
import workflowRoutes from "./workflowRuleRoutes";

const router = Router();

router.use("/cases", caseRoutes);
router.use("/tasks", taskRoutes);
router.use("/workflow", workflowRoutes);

export default router;
