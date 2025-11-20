import express from "express";
import bodyParser from "body-parser";
import routes from "../routes";
import * as ScheduleService from "../services/scheduleService";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/api", routes);

// Basic health check
app.get("/", (_req, res) => res.send("Workflow API is running"));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Scheduled rule processor every minute
setInterval(async () => {
  try {
    await ScheduleService.processScheduledRules();
    console.log("Processed scheduled rules");
  } catch (err) {
    console.error("Error processing scheduled rules:", err);
  }
}, 60 * 1000); // every 60 seconds
