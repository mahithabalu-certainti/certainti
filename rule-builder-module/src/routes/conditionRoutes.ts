import { Router } from "express";
import {
  createCondition,
  getConditionsByRule,
  deleteConditionsByRule
} from "../models/condition";

const router = Router();

// Create condition for a rule
router.post("/", async (req, res) => {
  try {
    const condition = await createCondition(req.body);
    res.status(201).json(condition);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get conditions for a rule
router.get("/rule/:ruleId", async (req, res) => {
  const ruleId = Number(req.params.ruleId);
  const conditions = await getConditionsByRule(ruleId);
  res.json(conditions);
});

// Delete all conditions for a rule
router.delete("/rule/:ruleId", async (req, res) => {
  await deleteConditionsByRule(Number(req.params.ruleId));
  res.json({ deleted: true });
});

export default router;
