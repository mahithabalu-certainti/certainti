import { Router } from "express";
import {
  createRuleController,
  getRuleController,
  updateRuleController,
  deleteRuleController
} from "../controllers/ruleController";

const router = Router();

// Create rule (with conditions + actions)
router.post("/", createRuleController);

// Get rule with conditions + actions
router.get("/:id", getRuleController);

// Update rule (replace conditions + actions)
router.put("/:id", updateRuleController);

// Delete rule
router.delete("/:id", deleteRuleController);

export default router;
