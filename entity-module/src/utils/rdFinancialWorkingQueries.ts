import { MAIN_SCHEMA_NAME } from "./constants";

export const findTaskWeightageDetails = (weightageIds: string[]) => {
    return `SELECT rid, weightage_value FROM ${MAIN_SCHEMA_NAME}.task_weightage WHERE rid IN (${weightageIds.map((d: string) => `'${d}'`).join(',')})`
}

export const getCompletedTaskStatusId = () => {
    return `SELECT rid FROM ${MAIN_SCHEMA_NAME}.case_task_status WHERE task_status_name ILIKE '%Completed%'`
}
