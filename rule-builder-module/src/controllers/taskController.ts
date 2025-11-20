import { Request, Response } from "express";
import * as TaskModel from "../models/tasks";

export const createTask = async (req: Request, res: Response) => {
  try {
    const newTask = await TaskModel.createTask(req.body);
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await TaskModel.getTaskById(Number(req.params.taskId));
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const getAllTasks = async (_req: Request, res: Response) => {
  try {
    const tasks = await TaskModel.getAllTasks();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const updatedTask = await TaskModel.updateTask(Number(req.params.taskId), req.body);
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const result = await TaskModel.deleteTask(Number(req.params.taskId));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
