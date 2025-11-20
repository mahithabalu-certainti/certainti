import * as ScheduleModel from "../models/workflowRuleScheduleQueue";
import * as WorkflowRuleService from "./workflowRuleService";
import { getEntityById } from "./entityService"; // the function above


export const processScheduledRules = async () => {
  const schedules = await ScheduleModel.getPendingSchedules();
  const now = new Date();

  for (const schedule of schedules) {
    if (new Date(schedule.scheduledDatetime) <= now) {
      // Fetch entity (case/task) by schedule.relatedTaskRid
      const entity = await getEntityById(schedule.relatedTaskRid); // implement
      await WorkflowRuleService.evaluateRuleForEntity(schedule.ruleRid, entity, schedule.createdBy);
      await ScheduleModel.markScheduleExecuted(schedule.rid);
    }
  }
};
