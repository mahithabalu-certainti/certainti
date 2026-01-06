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
    const schdulerExpression = await getSecret(process.env.SCHEDULER_EXPRESSION as string) || `0 0 * * *`;
    logMessage(`Scheduler expression ${schdulerExpression}`)
    logMessage(`Scheduler expression from env ${process.env.SCHEDULER_EXPRESSION}`)
    const task = cron.schedule(schdulerExpression, async () => {
        if (isJobRunning) {
            logMessage(`Skipped at: ${new Date().toISOString()} — previous job still running`);
            return;
        }
        isJobRunning = true
        logMessage(`Scheduler starts at: ${new Date().toISOString()}`);
        try {
            const schedulerRecord = await interactionSchemaService.createSchedulerRecords()
            if (schedulerRecord) {
                await interactionService.triggerAiFromScheduler(schedulerRecord)
            }
        } catch (error) {
            logMessage(`Error in scheduled task: ${error}`);
        } finally {
            isJobRunning = false;
            logMessage(`Scheduler finished at: ${new Date().toISOString()}`);
        }
    })
    return task;
}

export const schdulerForSendEmailInfo = async () => {
    const schdulerExpression = await getSecret(process.env.SCHEDULER_EMAIL as string) || `0 30 9 * * *`;
    const scheduler = cron.schedule(schdulerExpression, async () => {
        try {
            logMessage(`Scheduler started for sending emails: ${new Date().toISOString()}`);
            await interactionService.sendEmailInBatch()
        } catch (error) {
            logMessage(`Error in scheduled task: ${error}`);
        }
    })
    return scheduler
}