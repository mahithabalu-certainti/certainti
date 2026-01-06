import cron from "node-cron";
import Configurations from "../config/config";

const services = Configurations.getInstance().getServices();
const schedulerService = services.schedulerService;
import { getSecret } from "./azureSecrets";
import { logMessage } from "./helpers";

let isJobRunning = false;

export const schedulerForTriggerRule = async () => {
  const schdulerExpression = await getSecret(process.env.SCHEDULER_EXPRESSION_RULE_ENGINE as string) || `0 0 * * *`;
  console.log(`Scheduler Expression: ${schdulerExpression}`);
  const task = cron.schedule(schdulerExpression, async () => {
    if (isJobRunning) {
      logMessage(
        `Skipped at: ${new Date().toISOString()} — previous job still running`
      );
      return;
    }
    isJobRunning = true;
    logMessage(`Scheduler starts at: ${new Date().toISOString()}`);
    try {
      const schedulerRecord = await schedulerService.createSchedulerRecords();
      if (schedulerRecord) {
        await schedulerService.triggerRuleFromScheduler(schedulerRecord);
      }
    } catch (error) {
      logMessage(`Error in scheduled task: ${error}`);
    } finally {
      isJobRunning = false;
      logMessage(`Scheduler finished at: ${new Date().toISOString()}`);
    }
  });
  return task;
};
