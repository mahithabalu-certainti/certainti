import cron from 'node-cron'
import Configurations from '../config/config'
import InteractionSchemaService from '../services/interactions/schemaService';

const services = Configurations.getInstance().getServices();
const interactionService = services.interactionService
const interactionSchemaService = new InteractionSchemaService()
import { getSecret } from "./azureSecrets";
import { logMessage } from './helpers';

let isJobRunning = false

export const schedulerForTriggerAi = async () => {
    const schdulerExpression = await getSecret(process.env.SCHEDULER_EXPRESSION as string) || `0 */12 * * *`;
    logMessage(`Scheduler Expression for Trigger AI: ${schdulerExpression}`);
    const task = cron.schedule(schdulerExpression, async () => {
        if (isJobRunning) {
            logMessage(`Skipped at: ${new Date().toISOString()} — previous job still running`);
            return;
        }
        isJobRunning = true
        logMessage(`Trigger AI Scheduler starts at: ${new Date().toISOString()}`);
        try {
            const schedulerRecord = await interactionSchemaService.createSchedulerRecords()
            if (schedulerRecord) {
                await interactionService.triggerAiFromScheduler(schedulerRecord)
            } else {
                logMessage(`Skipped at: ${new Date().toISOString()} — AI Trigger execution already running in database`);
            }
        } catch (error) {
            logMessage(`Error in scheduled task: ${error}`);
        } finally {
            isJobRunning = false;
            logMessage(`Trigger AI Scheduler finished at: ${new Date().toISOString()}`);
        }
    })
    return task;
}

// export const schdulerForSendEmailInfo = async () => {
//     const schdulerExpression = await getSecret(process.env.SCHEDULER_EMAIL as string) || `*/30 * * * * *`;
//     logMessage(`Scheduler Expression for Send Email: ${schdulerExpression}`);
//     const scheduler = cron.schedule(schdulerExpression, async () => {
//         logMessage(`Send Email Scheduler starts at: ${new Date().toISOString()}`);
//         try {
//             const schedulerRecord = await interactionSchemaService.createSchedulerRecordsForSendEmail()
//             if (schedulerRecord) {
//                 logMessage(`Found scheduler record for Send Email: ${schedulerRecord.rid}`);
//                 await interactionService.sendEmailInBatch(schedulerRecord)
//                 await interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, 'success')
//             } else {
//                 logMessage(`Skipped at: ${new Date().toISOString()} — Send Email execution already running in database`);
//             }
//         } catch (error) {
//             logMessage(`Error in scheduled task: ${error}`);
//         }
//         logMessage(`Send Email Scheduler finished at: ${new Date().toISOString()}`);
//     })
//     return scheduler
// }
export const schdulerForSendEmailInfo = async () => {
  const schdulerExpression = await getSecret(process.env.SCHEDULER_EMAIL as string) || `*/30 * * * * *`;
  logMessage(`Scheduler Expression for Send Email: ${schdulerExpression}`);

  let isRunning = false; // ✅ In-process lock to prevent overlap

  const scheduler = cron.schedule(schdulerExpression, async () => {
    if (isRunning) {
      logMessage(`[SKIP] Send Email scheduler already running. Skipping tick.`);
      return;
    }

    isRunning = true;
    logMessage(`Send Email Scheduler starts at: ${new Date().toISOString()}`);

    try {
      const schedulerRecord = await interactionSchemaService.createSchedulerRecordsForSendEmail();
      if (schedulerRecord) {
        logMessage(`Found scheduler record: ${schedulerRecord.rid}`);
        await interactionService.sendEmailInBatch(schedulerRecord);
        await interactionSchemaService.updateSchedulerRecords(schedulerRecord.rid, 'success');
      } else {
        logMessage(`[SKIP] Send Email already running in DB.`);
      }
    } catch (error) {
      logMessage(`[ERROR] Scheduled task failed: ${error}`);
    } finally {
      isRunning = false; // ✅ Always release lock
      logMessage(`Send Email Scheduler finished at: ${new Date().toISOString()}`);
    }
  });

  return scheduler;
};