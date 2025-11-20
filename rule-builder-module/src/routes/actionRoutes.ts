import { Router } from "express";
import {
  createAction,
  getActionsByRule,
  deleteActionsByRule
} from "../models/action";

const router = Router();

// Create action for rule
router.post("/", async (req, res) => {
  try {
    const action = await createAction(req.body);
    res.status(201).json(action);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get actions for a rule
router.get("/rule/:ruleId", async (req, res) => {
  const actions = await getActionsByRule(Number(req.params.ruleId));
  res.json(actions);
});

// Delete actions for rule
router.delete("/rule/:ruleId", async (req, res) => {
  await deleteActionsByRule(Number(req.params.ruleId));
  res.json({ deleted: true });
});

export default router;
