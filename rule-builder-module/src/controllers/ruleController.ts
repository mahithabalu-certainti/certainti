import { Request, Response } from "express";
import {
    createFullRule, getFullRule, updateFullRule, deleteFullRule
} from "../services/ruleservice";

export const createRuleController = async (req: Request, res: Response) => {
    try {
        const { rule, conditions, actions } = req.body;

        const saved = await createFullRule(rule, conditions, actions);

        res.status(201).json(saved);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getRuleController = async (req: Request, res: Response) => {
    const rule = await getFullRule(Number(req.params.id));
    res.json(rule);
};

export const updateRuleController = async (req: Request, res: Response) => {
    const { rule, conditions, actions } = req.body;

    const updated = await updateFullRule(
        Number(req.params.id),
        rule,
        conditions,
        actions
    );

    res.json(updated);
};

export const deleteRuleController = async (req: Request, res: Response) => {
    await deleteFullRule(Number(req.params.id));
    res.json({ deleted: true });
};
