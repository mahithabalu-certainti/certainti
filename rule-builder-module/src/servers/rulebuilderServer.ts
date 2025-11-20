import express from "express";
import bodyParser from "body-parser";
import routes from "../routes";
import * as ScheduleService from "../services/scheduleService";

export const createRuleBuilderServer = () => {
  const app = express();

  // Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use("/api", routes);

  // Health check
  app.get("/", (_req, res) => {
    res.send("Workflow Rule Builder API is running");
  });

  // Scheduled rule processor (every 60 seconds)
  setInterval(async () => {
    try {
      await ScheduleService.processScheduledRules();
      console.log(`[Scheduler] Processed scheduled rules at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("[Scheduler] Error processing scheduled rules:", err);
    }
  }, 60 * 1000); // every 60 seconds

  return app;
};
