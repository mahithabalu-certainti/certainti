import cron from 'node-cron'
import Configurations from '../config/config'
import InteractionSchemaService from '../services/interactions/schemaService';

const services = Configurations.getInstance().getServices();
const interactionService = services.interactionService
const interactionSchemaService = new InteractionSchemaService()

export const schedulerForTriggerAi = () => {
    const task = cron.schedule(process.env.SCHEDULER_EXPRESSION!, async () => {
        console.log("Scheduler starts at : ", new Date().toISOString())
        try {
            const schedulerRecord = await interactionSchemaService.createSchedulerRecords()
            if(schedulerRecord) {
                await interactionService.triggerAiFromScheduler(schedulerRecord)
            }   
        } catch (error) {
            console.error("Error in scheduled task:", error);
        }
    })
    return task;
}