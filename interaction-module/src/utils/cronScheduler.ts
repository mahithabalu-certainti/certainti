import cron from 'node-cron'
import Configurations from '../config/config'

const services = Configurations.getInstance().getServices();
const interactionService = services.interactionService

export const schedulerForTriggerAi = async () => {
    cron.schedule(process.env.SCHEDULER_EXPRESSION!, async () => {
        console.log("Scheduler starts at : ", new Date().toISOString())
        await interactionService.triggerAiFromScheduler()
    })
}