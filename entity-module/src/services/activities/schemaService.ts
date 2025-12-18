import { initMainDbSequelize } from "../../config/mainDataSource";
import {
    col,
    fn,
    Op,
    QueryTypes,
    Sequelize,
    Transaction,
    UUIDV4,
    where,
} from "sequelize";
import { CaseModelService } from "../cases/caseModelsService";
import {
    HttpStatus,
    MAIN_SCHEMA_NAME,
    rawQueries,
    STATUS_MESSAGE,
    //   meetingFields,
    //   activityStatus,
    constants,
    //   callFields,
    activityTypes
} from "../../utils/constants";
import {
    decryptClientSecret,
    deleteFromAzureBlob,
    errorLog,
    //   generateSasUrl,
    logMessage,
    uploadToAzureBlob,
} from "../../utils/helpers";
import {
    //   IActivityCall,
    //   IActivityEmail,
    //   IActivityMeeting,
    IActivityTask,
    ICreateChecklist
} from "../../utils/types";
import { TaskSummary } from "../../models/taskSummaryModel";

// import {
//   fetchActivityDetails,
//   fetchEmailActivityDetails,
// } from "../../utils/rawQueries";

import {
    TaskCollaborators,
} from "../../models/taskCollaboratorsModel";
import CaseSchemaService from "../cases/schemaService";
// import { sendEmailWithAttachment } from "../emailService";
// import { scheduleTeamsMeetingUtil } from "../../utils/teamsMeetingUtil";
import moment from "moment";
class ActivitySchemaService {
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;
    private caseModelService: CaseModelService;
    private caseSchemaService: CaseSchemaService;

    constructor() {
        this.caseModelService = new CaseModelService();
        this.caseSchemaService = new CaseSchemaService();
    }

    async fetchValidAccountNumberById(accountId: string) {
        try {
            if (!this.mainDbSequelize) {
                this.mainDbSequelize = await this.caseModelService.getMainSequelize();
            }

            const [account]: any[] = await this.mainDbSequelize.query(
                rawQueries.fetchParentAccountDetails,
                {
                    replacements: { rid: accountId },
                    type: "SELECT",
                }
            );

            let accountRnumber = account?.r_number;

            if (account?.storage_type === "store_in_parent") {
                const [accountData]: any[] = await this.mainDbSequelize.query(
                    rawQueries.fetchParentAccountDetails,
                    {
                        replacements: { rid: account?.parent_account_rid },
                        type: "SELECT",
                    }
                );
                accountRnumber = accountData?.r_number;
            }

            return {
                accountNumber: accountRnumber,
                accountId: account?.rid,
                accountName: account?.account_name,
                parentAccountId: account?.parent_account_rid,
            };
        } catch (err) {
            logMessage(`Error fetching account: ${err}`);
            throw new Error("Error fetching account : " + (err as Error).message);
        }
    }

    async checkIsExistingActivityTaskUnique(
        taskReq: any,
        accountNumber: string
    ): Promise<boolean> {
        const { Activities } = await this.caseModelService.getModels(accountNumber);
        const response = await Activities.findOne({
            where: {
                [Op.and]: [
                    where(
                        fn("LOWER", col("task_name")),
                        Op.eq,
                        taskReq.task_name.toLowerCase()
                    ),
                    { rid: { [Op.ne]: taskReq.task_rid } },
                    { activity_type: "Task" },
                ],
            },
        });
        return !response;
    }

    async updateActivityTask(
        accountNumber: string,
        taskRequest: IActivityTask,
        transaction: Transaction,
        userId: string
    ) {
        // Implementation for updating interactions in the database
        try {
            const { Activities, CheckList, CheckListItem } = await this.caseModelService.getModels(
                accountNumber
            );
            const existingTask = await Activities.findOne({
                where: { rid: taskRequest.task_rid },
                raw: true,
                transaction,
            });
            // Fix: assigned_to should not be undefined or empty string
            if (taskRequest.assigned_to === "" || typeof taskRequest.assigned_to === "undefined") {
                taskRequest.assigned_to = null;
            }
            if (taskRequest?.checklist_rid) {
                if (taskRequest.checklist_rid !== existingTask?.checklist_rid) {
                    if (existingTask?.checklist_rid !== null && existingTask?.checklist_rid !== '') {
                        const checklistResult = await CheckList.findOne({
                            where: {
                                attach_to: taskRequest.task_rid,
                                attachment_level: 'task',
                                checklist_template_rid: existingTask?.checklist_rid
                            }, raw: true
                        })

                        if (checklistResult) {
                            await CheckListItem.destroy({
                                where: {
                                    checklist_rid: checklistResult.rid
                                }
                            })
                            await CheckList.destroy({
                                where: {
                                    attach_to: taskRequest.task_rid,
                                    attachment_level: 'task',
                                    checklist_template_rid: existingTask?.checklist_rid
                                }
                            })
                        }
                    }
                    const response = await this.caseSchemaService.fetchChecklistTemplateDetailsById(taskRequest.checklist_rid);
                    response.checklist_items.map((item: any) => item.action_type = 'add');
                    let caseRequest: any = {
                        account_rid: taskRequest.account_rid!,
                        checklist_name: response.checklist_name,
                        checklist_description: response.description,
                        checklist_items: response.checklist_items,
                        attach_to: taskRequest.task_rid,
                        attachment_level: 'task',
                        created_by: userId,
                        created_datetime: new Date(),
                        fiscal_year: taskRequest.fiscal_year,
                        checklist_rid: taskRequest.checklist_rid,
                    };
                    const checklistResponse = await this.createCheckListForTask(accountNumber, caseRequest, transaction);
                    if (checklistResponse)
                        await this.caseSchemaService.manageCheckListItems(accountNumber, caseRequest, checklistResponse.rid, transaction);
                }
            }
            // Combine update: include modified_by and modified_datetime in the same update
            const [updatedResult] = await Activities.update(
                {
                    ...taskRequest,
                    modified_by: taskRequest.modified_by || userId,
                    modified_datetime: new Date(),
                },
                {
                    where: {
                        rid: taskRequest.task_rid,
                    },
                    transaction,
                }
            );
            if (updatedResult > 0) {
                const checkIsDifferentCollaborator = await this.isNewCollaborator(
                    userId,
                    accountNumber
                );
                if (!checkIsDifferentCollaborator && taskRequest?.modified_by) {
                    const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(
                        userId,
                        taskRequest.task_rid,
                        taskRequest.account_rid!,
                        accountNumber
                    );
                    if (!checkCollaboratorExists) {
                        await TaskCollaborators.create(
                            {
                                account_rid: taskRequest.account_rid!,
                                task_rid: taskRequest.task_rid,
                                assigned_to: taskRequest?.modified_by,
                                created_by: userId,
                                created_datetime: new Date(),
                            },
                            { transaction }
                        );
                    }
                }
                // await TaskSummary.update(
                //     {
                //         task_name: taskRequest.task_name || "",
                //         description: taskRequest.description || "",
                //         assigned_to: taskRequest.assigned_to || "",
                //         status_rid: taskRequest.status_rid || "",
                //         priority_rid: taskRequest.priority_rid || "",
                //         effective_start_datetime: taskRequest.effective_start_datetime,
                //         effective_end_datetime: taskRequest.effective_end_datetime,
                //         modified_by: taskRequest.modified_by || "",
                //         modified_datetime: new Date(),
                //     },
                //     {
                //         where: {
                //             task_rid: taskRequest.task_rid,
                //         }
                //     }
                // );
                await this.addActivityTaskHistory(
                    accountNumber,
                    taskRequest.task_rid as string,
                    { ...taskRequest, modified_by: userId },
                    existingTask,
                    activityTypes.task
                );
                if (!this.mainDbSequelize) {
                    this.mainDbSequelize = await this.caseModelService.getMainSequelize();
                }
                const [activeStatusRid]: any[] = await this.mainDbSequelize.query(
                    rawQueries.getActiveStatusId()
                );
                if (taskRequest.tags.length > 0) {
                    for (let d of taskRequest.tags) {
                        await this.caseSchemaService.createOrUpdateTags(
                            taskRequest.task_rid,
                            taskRequest.account_rid!,
                            "",
                            d.tag_rid,
                            d.is_new_tag,
                            accountNumber,
                            taskRequest.created_by,
                            activeStatusRid,
                            "activity"
                        );
                    }
                }
            }
            await this.addTaskManagementTimeline(
                accountNumber,
                taskRequest.task_rid,
                taskRequest.account_rid!,
                taskRequest,
                userId,
                "updated",
                "success",
                existingTask
            );

            return updatedResult;
        } catch (error) {
            logMessage(`Error updating task: ${error}`);
            throw new Error("Error updating task: " + error);
        }
    }

    async createCheckListForTask(
        accountNumber: string,
        caseRequest: ICreateChecklist,
        transaction: Transaction
    ) {
        // Implementation for creating checklist in the database
        try {
            const { CheckList } = await this.caseModelService.getModels(accountNumber);
            const findCheckListAlreadyCreated = await CheckList.findOne({
                where: {
                    attach_to: caseRequest.attach_to,
                    attachment_level: "task",
                    checklist_template_rid: caseRequest.checklist_rid
                }, raw: true
            });
            if (!findCheckListAlreadyCreated) {
                const createdChecklist = await CheckList.create(
                    {
                        account_rid: caseRequest.account_rid,
                        attach_to: caseRequest.attach_to,
                        attachment_level: caseRequest.attachment_level,
                        checklist_name: caseRequest.checklist_name,
                        checklist_description: caseRequest.checklist_description,
                        checklist_template_rid: caseRequest.checklist_rid || "",
                        fiscal_year: caseRequest.fiscal_year,
                        created_by: caseRequest.created_by,
                        status_rid: caseRequest.status_rid,
                        created_datetime: new Date(),

                    },
                    { transaction }
                );
                return createdChecklist;
            } else {
                return null;
            }
        } catch (error) {
            logMessage(`Error creating checklist: ${error}`);
            throw new Error("Error creating checklist: " + error);
        }
    }
    async isNewCollaborator(rid: string, accountNumber: string) {
        const { Activities } = await this.caseModelService.getModels(accountNumber);
        const result = await Activities.findOne({
            where: {
                assigned_to: rid,
            },
            raw: true,
        });
        if (result) return result;
        else return null;
    }

    async isCollaboratorAlreadyAdded(
        assignedTo: string,
        taskRid: string,
        accountRid: string,
        accountNumber: string
    ) {
        const { TaskCollaborators } = await this.caseModelService.getModels(
            accountNumber
        );
        const result = await TaskCollaborators.findOne({
            where: {
                assigned_to: assignedTo,
                account_rid: accountRid,
                task_rid: taskRid,
            },
            raw: true,
        });
        if (result) return result;
        else return null;
    }
    async addActivityTaskHistory(
        accountNumber: string,
        activityId: string,
        newCaseData: any,
        existingCaseData: any,
        activityType?: string
    ) {
        try {
            const { ActivityHistory } = await this.caseModelService.getModels(
                accountNumber
            );

            const excludedFields = [
                "created_by",
                "modified_by",
                "activity_rid",
                "account_rid",
                "modified_datetime",
                "task_rid",
                "accountRid"
            ];

            const cleanedNewData = Object.fromEntries(
                Object.entries(newCaseData).filter(
                    ([key]) => !excludedFields.includes(key)
                )
            );

            // Prepare mapping for assigned_to values
            const columnMapping = new Map();
            let assignedToOldValueString = null;
            let assignedToNewValueString = null;
            if (cleanedNewData.hasOwnProperty('assigned_to')) {
                const oldValue = existingCaseData['assigned_to'];
                const newValue = cleanedNewData['assigned_to'];
                if (oldValue || newValue) {
                    if (!this.mainDbSequelize) {
                        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
                    }
                    const result = await this.mainDbSequelize.query(rawQueries.fetchUserNames(String(oldValue || ''), String(newValue || '')));
                    for (let r of result[0]) {
                        columnMapping.set((r as any)?.rid, (r as any)?.name);
                    }
                    assignedToOldValueString = columnMapping.get(oldValue);
                    assignedToNewValueString = columnMapping.get(newValue);
                }
            }
            const statusMapping = new Map();
            let statusOldValueString = null;
            let statusNewValueString = null;
            if (cleanedNewData.hasOwnProperty('status_rid')) {
                const oldValue = existingCaseData['status_rid'];
                const newValue = cleanedNewData['status_rid'];
                if (oldValue || newValue) {
                    if (!this.mainDbSequelize) {
                        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
                    }
                    const result = await this.mainDbSequelize.query(rawQueries.fetchActivityStatusById(String(oldValue || ''), String(newValue || '')));
                    for (let r of result[0]) {
                        statusMapping.set((r as any)?.rid, (r as any)?.name);
                    }
                    statusOldValueString = statusMapping.get(oldValue);
                    statusNewValueString = statusMapping.get(newValue);
                }

            }

            // Prepare mapping for priority_rid values
            const priorityMapping = new Map();
            let priorityOldValueString = null;
            let priorityNewValueString = null;
            if (cleanedNewData.hasOwnProperty('priority_rid')) {
                const oldValue = existingCaseData['priority_rid'];
                const newValue = cleanedNewData['priority_rid'];
                if (oldValue || newValue) {
                    if (!this.mainDbSequelize) {
                        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
                    }
                    // Assuming rawQueries.fetchPriorityNames returns [{ rid, name }]
                    const result = await this.mainDbSequelize.query(rawQueries.fetchPriority(String(oldValue || ''), String(newValue || '')));
                    for (let r of result[0]) {
                        priorityMapping.set((r as any)?.rid, (r as any)?.pr);
                    }
                    priorityOldValueString = priorityMapping.get(oldValue);
                    priorityNewValueString = priorityMapping.get(newValue);
                }
            }



            const historyChanges = await Promise.all(Object.entries(cleanedNewData)
                .filter(([key, newValue]) => {
                    const oldValue = existingCaseData[key];
                    if (newValue == null && oldValue == null) return false;
                    if (typeof newValue === "number" || typeof oldValue === "number") {
                        return Number(newValue) !== Number(oldValue);
                    }
                    if (key === 'effective_start_datetime' || key === 'effective_end_datetime') {
                        const newDate = newValue ? moment.utc(newValue).format("YYYY-MM-DD") : null;
                        const oldDate = oldValue ? moment.utc(oldValue).format("YYYY-MM-DD") : null;
                        existingCaseData[key] = oldDate;
                        return String(newDate ?? "") !== String(oldDate ?? "");
                    }
                    if (key === "assigned_to") {
                        return assignedToOldValueString !== assignedToNewValueString;
                    }
                    if (key === "priority_rid") {
                        return priorityOldValueString !== priorityNewValueString;
                    }
                    if (key === "status_rid") {
                        return statusOldValueString !== statusNewValueString;
                    }
                    return String(newValue ?? "") !== String(oldValue ?? "");
                })
                .map(async ([key, newValue]) => {
                    // Map keys for display-friendly attribute names
                    let mappedKey = key;
                    let oldValueStr = existingCaseData[key] !== null && existingCaseData[key] !== undefined ? String(existingCaseData[key]) : "";
                    let newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : "";
                    if (key === 'priority_rid') {
                        mappedKey = 'Priority';
                        oldValueStr = priorityOldValueString ?? oldValueStr;
                        newValueStr = priorityNewValueString ?? newValueStr;
                    } else if (key === 'effective_start_datetime') {
                        mappedKey = 'Effective Start Date';
                    } else if (key === 'effective_end_datetime') {
                        mappedKey = 'Effective End Date';
                    } else if (key === 'assigned_to') {
                        mappedKey = 'Assigned To';
                        oldValueStr = assignedToOldValueString ?? oldValueStr;
                        newValueStr = assignedToNewValueString ?? newValueStr;
                    } else if (key === "status_rid") {
                        mappedKey = "Status";
                        oldValueStr = statusOldValueString ?? oldValueStr;
                        newValueStr = statusNewValueString ?? newValueStr;
                    }
                    return {
                        account_rid: newCaseData["account_rid"],
                        activity_rid: activityId,
                        attribute_name: mappedKey,
                        old_value: oldValueStr,
                        new_value: newValueStr,
                        created_by: newCaseData["modified_by"],
                        activity_type: activityType || newCaseData["activity_type"] || "",
                    };
                }));

            if (historyChanges.length === 0) return;


            // Use individual create operations to avoid sequence conflicts
            for (const historyChange of historyChanges) {
                await ActivityHistory.create(historyChange);
            }
        } catch (err) {
            errorLog("Error updating activity history : " + (err as Error).message);
            throw new Error(
                "Error updating activity history : " + (err as Error).message
            );
        }
    }

    async addTaskManagementTimeline(
        accountNumber: string,
        taskRid: string,
        accountRid: string,
        taskData: any,
        userId: string,
        operation: "created" | "updated",
        eventStatus: string = "success",
        existingTaskData?: any,
        attachmentLevel: string = "case"
    ) {
        try {
            const eventName =
                operation === "created" ? "Task Created" : "Task Updated";
            let description = "";

            if (operation === "created") {
                description = `Task created with name: ${taskData.task_name || "N/A"}`;
            } else {
                // For updates, show specific fields that changed
                const changes = this.generateChangeDescription(
                    taskData,
                    existingTaskData
                );
                description =
                    changes.length > 0
                        ? `Task updated: ${changes.join(", ")}`
                        : "Task updated";
            }

            await this.addTaskTimeline(
                accountNumber,
                taskRid,
                accountRid,
                description,
                userId,
                eventName,
                eventStatus,
                taskRid
            );
        } catch (err) {
            logMessage(`Error creating task management timeline: ${err}`);
            // Don't throw error for timeline issues to avoid breaking main functionality
        }
    }
    private generateChangeDescription(newData: any, existingData: any): string[] {
        if (!existingData) return [];

        const changes: string[] = [];
        const fieldMappings: { [key: string]: string } = {
            task_name: "task name",
            description: "description",
            fiscal_year: "fiscal year",
            priority_rid: "priority",
            status_rid: "status",
        };

        // Define which fields are dates
        const dateFields = ["effective_start_datetime", "effective_end_datetime"];

        for (const [field, displayName] of Object.entries(fieldMappings)) {
            if (
                newData[field] !== undefined &&
                newData[field] !== existingData[field]
            ) {
                let oldValue = existingData[field] || "N/A";
                let newValue = newData[field] || "N/A";

                // Format dates using the same function as case team timeline
                if (dateFields.includes(field)) {
                    oldValue =
                        oldValue !== "N/A" ? this.formatDateForDisplay(oldValue) : "N/A";
                    newValue =
                        newValue !== "N/A" ? this.formatDateForDisplay(newValue) : "N/A";
                }

                changes.push(`${displayName} changed to "${newValue}"`);
            }
        }

        return changes;
    }

    async addTaskTimeline(
        accountNumber: string,
        entity_rid: string,
        accountRid: string,
        description: string,
        userId: string,
        eventName: string,
        eventStatus: string,
        taskRid: string = ""
    ) {
        try {
            const { Activities } = await this.caseModelService.getModels(
                accountNumber
            );
            const entityresponse: any = await Activities.findOne({
                where: { rid: taskRid },
                raw: true,
            });
            if (!entityresponse) {
                logMessage(`No entity found for rid: ${taskRid}`);
                return;
            } else {
                const attachmentLevel = entityresponse?.attachment_level || "case";
                if (!this.orgDbSequelize) {
                    this.orgDbSequelize = await this.caseModelService.getSequelize();
                }
                const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
                    /\D/g,
                    ""
                )}`;
                let insertQuery = "";
                if (attachmentLevel === "case") {
                    /*const { CaseTimeline } = await this.caseModelService.getModels(
                    accountNumber
                  );
                  console.log("Adding case timeline...", entity_rid, accountRid, userId);
                  await CaseTimeline.create({
                    account_rid: accountRid,
                    event_name: eventName,
                    event_status: eventStatus,
                    event_type: "ui handler",
                    entity_rid: entity_rid || "",
                    description: description,
                    created_by: userId,
                    event_datetime: new Date(),
                    created_datetime: new Date(),
                  }); */
                    insertQuery = rawQueries.insertTimeline(schemaName, "case_timeline");
                } else if (attachmentLevel === "project") {
                    insertQuery = rawQueries.insertTimeline(
                        schemaName,
                        "project_timeline"
                    );
                } else if (attachmentLevel === "project_resource") {
                    insertQuery = rawQueries.insertTimeline(
                        schemaName,
                        "project_resource_timeline"
                    );
                } else if (attachmentLevel === "project_task") {
                    insertQuery = rawQueries.insertTimeline(
                        schemaName,
                        "project_task_timeline"
                    );
                } else if (attachmentLevel === "resource") {
                    insertQuery = rawQueries.insertTimeline(
                        schemaName,
                        "resource_timeline"
                    );
                } else {
                    insertQuery = rawQueries.insertTimeline(
                        schemaName,
                        "account_timeline"
                    );
                }

                await this.orgDbSequelize.query(insertQuery, {
                    type: QueryTypes.INSERT,
                    replacements: {
                        event_name: eventName,
                        account_rid: accountRid,
                        event_status: eventStatus,
                        event_type: "ui handler",
                        entity_rid: entity_rid || "",
                        description: description,
                        created_by: userId,
                        event_datetime: new Date(),
                        created_datetime: new Date(),
                    },
                });
            }
        } catch (err) {
            logMessage(`Error creating case team timeline: ${err}`);
        }
    }

    /**
 * Formats dates for display in error messages
 */
    private formatDateForDisplay(date: Date | string | null): string {
        if (!date) return "";
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return dateObj.toISOString().split("T")[0] || "invalid-date";
    }
}



export default ActivitySchemaService;