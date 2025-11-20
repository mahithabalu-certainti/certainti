import { Request, Response } from "express";
import * as ScheduleQueueModel from "../models/workflowRuleScheduleQueue";

export const createScheduleQueue = async (req: Request, res: Response) => {
  try {
    const newSchedule = await ScheduleQueueModel.createScheduleQueue(req.body);
    res.status(201).json(newSchedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create schedule queue entry" });
  }
};

export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduleQueueModel.getScheduleById(Number(req.params.rid));
    if (!schedule) return res.status(404).json({ error: "Schedule entry not found" });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schedule entry" });
  }
};

export const getSchedulesByRule = async (req: Request, res: Response) => {
  try {
    const schedules = await ScheduleQueueModel.getSchedulesByRule(Number(req.params.ruleRid));
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schedule entries" });
  }
};

export const updateScheduleQueue = async (req: Request, res: Response) => {
  try {
    const updatedSchedule = await ScheduleQueueModel.updateScheduleQueue(Number(req.params.rid), req.body);
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update schedule entry" });
  }
};

export const markScheduleExecuted = async (req: Request, res: Response) => {
  try {
    const updatedSchedule = await ScheduleQueueModel.markScheduleExecuted(Number(req.params.rid));
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark schedule as executed" });
  }
};

export const deleteScheduleQueue = async (req: Request, res: Response) => {
  try {
    const result = await ScheduleQueueModel.deleteScheduleQueue(Number(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete schedule entry" });
  }
};
