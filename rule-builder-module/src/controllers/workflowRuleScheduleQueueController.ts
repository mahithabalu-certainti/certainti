import { Request, Response } from "express";
import { HttpStatus } from "../utils/constants";
import {
  errorLog,
  handleErrorResponse,
  handleSuccessResponse,
} from "../utils/helpers";
import * as ScheduleService from "../services/workflowScheduleQueueService";


export const createScheduleQueue = async (req: Request, res: Response) => {
  const methodName = "create schedule";
  try {
    const newSchedule = await ScheduleService.createRuleSchedule(req.body);
    res.status(201).json(newSchedule);
  } catch (err) {
    const error = err as Error;
    errorLog(methodName, error.message);
    handleErrorResponse(
      res,
      HttpStatus.FAILED,
      HttpStatus.FAILED_MESSAGE,
      error.message
    );
  }
};

export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const schedule = await ScheduleService.getRuleScheduleById(String(req.params.rid));
    if (!schedule) return res.status(404).json({ error: "Schedule entry not found" });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schedule entry" });
  }
};

export const getSchedulesByRule = async (req: Request, res: Response) => {
  try {
    const schedules = await ScheduleService.getRuleScheduleByRule(String(req.params.ruleRid));
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch schedule entries" });
  }
};

export const updateScheduleQueue = async (req: Request, res: Response) => {
  try {
    const updatedSchedule = await ScheduleService.updateRuleSchedule(String(req.params.rid), req.body);
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update schedule entry" });
  }
};

export const markScheduleExecuted = async (req: Request, res: Response) => {
  try {
    const updatedSchedule = await ScheduleService.markScheduleExecuted(String(req.params.rid));
    res.json(updatedSchedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark schedule as executed" });
  }
};

export const deleteScheduleQueue = async (req: Request, res: Response) => {
  try {
    const result = await ScheduleService.deleteRuleSchedule(String(req.params.rid));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete schedule entry" });
  }
};
