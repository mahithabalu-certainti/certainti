import cron from 'node-cron'
import Configurations from '../config/config'
import InteractionSchemaService from '../services/interactions/schemaService';

const services = Configurations.getInstance().getServices();
const interactionService = services.interactionService
const interactionSchemaService = new InteractionSchemaService()

export const schedulerForTriggerAi = async () => {
    cron.schedule(process.env.SCHEDULER_EXPRESSION!, async () => {
        console.log("Scheduler starts at : ", new Date().toISOString())
        const schedulerRecord = await interactionSchemaService.createSchedulerRecords()
        if(schedulerRecord) {
            await interactionService.triggerAiFromScheduler(schedulerRecord)
        }
    })
}