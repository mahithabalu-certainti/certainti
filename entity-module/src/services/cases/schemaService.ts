import { initOrgSequelize } from "../../config/orgDataSource";
import dayjs from "dayjs";
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
import { CaseModelService } from "./caseModelsService";
import {
    UpdateCaseTaskType,
    CaseTaskWorkFlowCreate,
} from "../../utils/types";
import {
    ALPHANUMERIC_CONDITIONS,
    ENV_PREFIX,
    HttpStatus,
    MAIN_SCHEMA_NAME,
    rawQueries,
    SCHEMANAME_PREFIX,
    STATUS_MESSAGE,
    relationshipTypes,
} from "../../utils/constants";
import { getColumnsNamesForTaskUpdate, logMessage } from "../../utils/helpers";
import { CaseTaskWorkflowConnector } from "../../models/caseTaskWorkflowConnectorModel";
import { CaseTask, setupCaseTaskSequence } from "../../models/caseTaskModel";
import { TaskHistory } from "../../models/taskHistory";





class CaseSchemaService {
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;
    private caseModelService: CaseModelService;


    constructor() {
        this.caseModelService = new CaseModelService();
    }

    async findTaskById(rid: string, accountRid: string, caseRid: string, accountNumber: string, taskType?: string) {
        const { CaseTask, Activities } = await this.caseModelService.getModels(accountNumber);
        if (taskType === "activity") {
            const checkTaskExists = await Activities.findOne({
                where: {
                    rid: rid,
                    account_rid: accountRid,
                },
                raw: true
            })
            if (checkTaskExists) return checkTaskExists
            else return null
        }
        else {
            const checkTaskExists = await CaseTask.findOne({
                where: {
                    rid: rid,
                    account_rid: accountRid,
                    case_rid: caseRid
                },
                raw: true
            })
            if (checkTaskExists) return checkTaskExists
            else return null

        }

    }

    async checkTaskNameExistsForUpdate(data: UpdateCaseTaskType, accountNumber: string, eid: string) {
        const { CaseTask } = await this.caseModelService.getModels(accountNumber)
        const checkTaskExists = await CaseTask.findOne({
            attributes: ['rid'],
            where: {
                task_name: {
                    [Op.iLike]: data.task_name
                },
                eid: {
                    [Op.notIn]: [eid]
                },
                account_rid: {
                    [Op.in]: [data.account_rid]
                },
                case_rid: {
                    [Op.in]: [data.case_rid]
                }
            },
            raw: true
        })
        if (checkTaskExists) return checkTaskExists
        else return null
    }

    async updateUserLevelTask(data: UpdateCaseTaskType, accountNumber: string, transaction: Transaction, activeStatusRid: string) {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        const { CaseTask, CaseTimeline, CaseHistory, TaskCollaborators } = await this.caseModelService.getModels(accountNumber);
        const checkCaseExists = await this.isCaseExistsForAccount(data.account_rid, data.case_rid, accountNumber);
        if (!checkCaseExists) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: STATUS_MESSAGE.caseNotFound
            }
        } else {
            const isTaskExists: any = await this.findTaskById(data.rid, data.account_rid, data.case_rid, accountNumber, "milestone");
            if (!isTaskExists) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    statusMessage: STATUS_MESSAGE.taskNotFound
                }
            } else {
                if (isTaskExists.task_status_rid !== data.task_status_rid) {
                    const workflowResult = await this.checkTaskWorkFlow(accountNumber, data.rid, data.task_status_rid);
                    if (workflowResult?.success) {
                        return {
                            statusCode: HttpStatus.BAD_REQUEST,
                            statusMessage: workflowResult.statusMessage
                        }
                    }
                }
                if (data.assigned_to !== null && data.assigned_to !== '' && data.assigned_to !== undefined) {
                    if (data.assigned_to !== isTaskExists.assigned_to) {
                        const findUserRoleId = await this.fetchAssignedToRole(data.assigned_to, data.case_rid, data.account_rid, accountNumber);
                        data.case_team_member_role_rid = findUserRoleId?.role_rid!
                    }
                }
                const [updatedResult] = await CaseTask.update(data, {
                    where: {
                        rid: data.rid,
                        account_rid: data.account_rid,
                        case_rid: data.case_rid
                    }, transaction
                });
                /* await TaskSummary.update(
                 {
                   task_name: data.task_name || "",
                   description: data.task_description || "",
                   assigned_to: data.assigned_to || "",
                   status_rid: data.task_status_rid || "",
                   priority_rid: data.priority_rid || "",
                   effective_start_datetime: data.effective_start_datetime,
                   effective_end_datetime: data.effective_end_datetime,
                   modified_by: data.modified_by || "",
                   modified_datetime: new Date(),
                 },
                 {
                 where : {
                     task_rid : data.rid
                   }
               }
               ); */
                const checkIsDifferentCollaborator = await this.isNewCollaborator(data.modified_by, accountNumber, "case_task");
                if (!checkIsDifferentCollaborator) {
                    const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(data.modified_by, data.case_rid, data.account_rid, data.rid, accountNumber, "case_task");
                    if (!checkCollaboratorExists) {
                        await TaskCollaborators.create({
                            case_rid: data.case_rid,
                            account_rid: data.account_rid,
                            task_rid: data.rid,
                            assigned_to: data.modified_by,
                            created_by: data.modified_by,
                            created_datetime: new Date()
                        }, { transaction });
                    }
                }
                if (updatedResult == 1) {
                    if (data.tags.length > 0) {
                        for (let d of data.tags) {
                            await this.createOrUpdateTags(isTaskExists.rid, data.account_rid, data?.case_rid, d.tag_rid, d.is_new_tag, accountNumber, data.modified_by, activeStatusRid)
                        }
                    }
                    if (Object.keys(data.workflow_connector).length > 0) {
                        data.workflow_connector.created_by = data.modified_by
                        data.workflow_connector.case_rid = data.case_rid
                        data.workflow_connector.account_rid = data.account_rid
                        if (data.workflow_connector.target_rid.length > 0) {
                            await this.taskWorkflowConnector(accountNumber, data.workflow_connector, transaction);
                        }
                        if (data.workflow_connector.delete_target_rids !== undefined) {
                            if (data.workflow_connector.delete_target_rids.length > 0)
                                await this.deleteTaskWorkConnector(accountNumber, data.workflow_connector)
                        }
                    }
                    const fetchUpdatedColumns = getColumnsNamesForTaskUpdate(data, isTaskExists as any);
                    if (fetchUpdatedColumns.length > 0) {
                        let updatedColumnsStorage: string[] = []
                        let oldValue: string;
                        let newValue: string;
                        let columnName: string;
                        let combinedColumns: string = ``
                        let columnMapping: Map<string, string> = new Map()
                        let newValueString;
                        let oldValueString;
                        console.log(fetchUpdatedColumns)
                        for (let c of fetchUpdatedColumns) {
                            oldValue = (isTaskExists as any)[c]
                            newValue = (data as any)[c]
                            columnName = c

                            if (columnName == "assigned_to") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchUserNames(oldValue, newValue))
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.name)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else if (columnName === "checklist_template_rid") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchCheckLists(oldValue, newValue));
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.checklist_name)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else if (columnName === "priority_rid") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchPriority(oldValue, newValue));
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.priority_name)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else if (columnName === "task_status_rid") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskStatus(oldValue, newValue));
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.task_status_name)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else if (columnName === "weightage_rid") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskWeightage(oldValue, newValue));
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.weightage_value)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else if (columnName === "task_category_rid") {
                                const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskCategory(oldValue, newValue));
                                for (let r of result[0]) {
                                    columnMapping.set(r.rid, r.category_name)
                                }
                                oldValueString = columnMapping.get(oldValue)
                                newValueString = columnMapping.get(newValue)
                            }
                            else {
                                oldValueString = oldValue
                                newValueString = newValue
                            }
                            await CaseHistory.create({
                                created_by: data.modified_by,
                                created_datetime: new Date(),
                                case_rid: data.case_rid,
                                attribute_name: columnName,
                                old_value: oldValueString,
                                new_value: newValueString,
                                task_rid: data.rid
                            })
                            updatedColumnsStorage.push(`${oldValue} changed to ${newValue}`);
                        }
                        if (updatedColumnsStorage.length > 0) {
                            combinedColumns = updatedColumnsStorage.join(', ')
                        }
                        await CaseTimeline.create({
                            created_by: data.modified_by,
                            created_datetime: new Date(),
                            account_rid: data.account_rid,
                            entity_rid: data.rid,
                            event_name: "Task Updated",
                            event_type: "ui handler",
                            event_status: "success",
                            event_datetime: new Date(),
                            description: `Task Updated : ${combinedColumns}`
                        })
                    }

                    return {
                        statusCode: HttpStatus.SUCCESS,
                        statusMessage: STATUS_MESSAGE.taskUpdatedSuccess
                    }
                } else {
                    return {
                        statusCode: HttpStatus.FAILED,
                        statusMessage: STATUS_MESSAGE.taskUpdateFailed
                    }
                }
            }
        }
    }

    async isCaseExistsForAccount(
        accountRid: string,
        caseRid: string,
        accountNumber: string
    ) {
        const { Case } = await this.caseModelService.getModels(accountNumber);
        const result = await Case.findOne({
            where: {
                account_rid: accountRid,
                rid: caseRid,
            },
            raw: true,
        });
        if (result) return result;
        else null;
    }

    async checkTaskWorkFlow(accountNumber: string, taskRid: string, statusRid: string) {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        const { CaseTaskWorkflowConnector } = await this.caseModelService.getModels(accountNumber);
        const findTaskDependency = await CaseTaskWorkflowConnector.findAll({
            where: {
                source_rid: taskRid
            }, raw: true
        });
        if (findTaskDependency.length > 0) {
            const result = await this.sourceTaskValidation(accountNumber, findTaskDependency, taskRid, statusRid);
            if (result?.success) {
                return {
                    success: true,
                    statusMessage: result.statusMessage
                }
            }
            else {
                const findTargetTaskDependency = await CaseTaskWorkflowConnector.findAll({
                    where: {
                        target_rid: taskRid
                    }, raw: true
                });
                if (findTaskDependency.length > 0) {
                    const result = await this.targetTaskValidation(accountNumber, findTargetTaskDependency, taskRid, statusRid);
                    if (result?.success) {
                        return {
                            success: true,
                            statusMessage: result.statusMessage
                        }
                    }
                    else {
                        return {
                            success: false,
                            statusMessage: null
                        }
                    }
                }
            }
        }
    }

    private async sourceTaskValidation(accountNumber: string, findTaskDependency: CaseTaskWorkflowConnector[], sourceRid: string, statusRid: string) {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        const { WorkflowConnector, CaseTask } = await this.caseModelService.getModels(accountNumber);
        const relationIds = [...new Set(findTaskDependency.map((d: CaseTaskWorkflowConnector) => d.relationship_connector_rid))];
        const findRelationshipConnector = await WorkflowConnector.findAll({
            where: {
                rid: {
                    [Op.in]: relationIds
                }
            }, raw: true
        });
        if (findRelationshipConnector.length > 0) {
            const mapRelationShip: Map<string, string> = new Map(findRelationshipConnector.map((d: any) => [d.rid, d.relationship_type]));
            const targetIds = [...new Set(findTaskDependency.map((d: CaseTaskWorkflowConnector) => d.target_rid))];
            targetIds.push(sourceRid)
            const findCaseTasks = await CaseTask.findAll({
                where: {
                    rid: {
                        [Op.in]: targetIds
                    }
                }, raw: true
            });
            if (findCaseTasks.length > 0) {
                const mapTargetTasks: Map<string, CaseTask> = new Map(findCaseTasks.map((d: any) => [d.rid, d]));

                const taskStatusIds = [...new Set(findCaseTasks.map((d: any) => d.task_status_rid))];
                taskStatusIds.push(statusRid);
                let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
                if (fetchStatusQuery) {
                    const findTaskStatus: any = await this.mainDbSequelize.query(fetchStatusQuery);
                    const taskStatusMap = new Map(findTaskStatus[0].map((d: any) => [d.rid, d.task_status_name]));

                    for (let f of findTaskDependency) {
                        if (mapRelationShip.get(f.relationship_connector_rid) === 'Is Enabled By') {
                            if (taskStatusMap.get(mapTargetTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                                if (taskStatusMap.get(statusRid) === "Completed") {
                                    return {
                                        success: true,
                                        statusCode: HttpStatus.BAD_REQUEST,
                                        statusMessage: `This task cannot be completed because it is enabled by ${mapTargetTasks.get(f.target_rid)?.task_name}`
                                    }
                                }
                            }
                        }
                        else if (mapRelationShip.get(f.relationship_connector_rid) === "Is Blocked By") {
                            if (taskStatusMap.get(mapTargetTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                                return {
                                    success: true,
                                    statusCode: HttpStatus.BAD_REQUEST,
                                    statusMessage: `This task is blocked by ${mapTargetTasks.get(f.target_rid)?.task_name}. Please complete that task before proceeding.`
                                }
                            }
                        } else {
                            return {
                                success: false,
                                statusCode: HttpStatus.BAD_REQUEST,
                                statusMessage: null
                            }
                        }
                    }
                }
            }
        }
    }

    private async targetTaskValidation(accountNumber: string, findTaskDependency: CaseTaskWorkflowConnector[], targetRid: string, statusRid: string) {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize()
        }
        const { WorkflowConnector, CaseTask } = await this.caseModelService.getModels(accountNumber);
        const relationIds = [...new Set(findTaskDependency.map((d: CaseTaskWorkflowConnector) => d.relationship_connector_rid))];
        const findRelationshipConnector = await WorkflowConnector.findAll({
            where: {
                rid: {
                    [Op.in]: relationIds
                }
            }, raw: true
        });
        if (findRelationshipConnector.length > 0) {
            const mapRelationShip: Map<string, string> = new Map(findRelationshipConnector.map((d: any) => [d.rid, d.relationship_type]));
            const sourceIds = [...new Set(findTaskDependency.map((d: CaseTaskWorkflowConnector) => d.source_rid))];
            sourceIds.push(targetRid)
            const findCaseTasks = await CaseTask.findAll({
                where: {
                    rid: {
                        [Op.in]: sourceIds
                    }
                }, raw: true
            });
            if (findCaseTasks.length > 0) {
                const mapSourceTasks: Map<string, CaseTask> = new Map(findCaseTasks.map((d: any) => [d.rid, d]));

                const taskStatusIds = [...new Set(findCaseTasks.map((d: any) => d.task_status_rid))];
                taskStatusIds.push(statusRid);
                let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
                if (fetchStatusQuery) {
                    const findTaskStatus: any = await this.mainDbSequelize.query(fetchStatusQuery);
                    const taskStatusMap = new Map(findTaskStatus[0].map((d: any) => [d.rid, d.task_status_name]));

                    for (let f of findTaskDependency) {
                        if (mapRelationShip.get(f.relationship_connector_rid) === 'Enables') {
                            if (taskStatusMap.get(mapSourceTasks.get(f.source_rid)?.task_status_rid) !== "Completed") {
                                if (taskStatusMap.get(statusRid) === "Completed") {
                                    return {
                                        success: true,
                                        statusCode: HttpStatus.BAD_REQUEST,
                                        statusMessage: `This task cannot be completed because it is enabled by ${mapSourceTasks.get(f.source_rid)?.task_name}`
                                    }
                                }
                            }
                        }
                        else if (mapRelationShip.get(f.relationship_connector_rid) === "Blocks") {
                            if (taskStatusMap.get(mapSourceTasks.get(f.target_rid)?.task_status_rid) !== "Completed") {
                                return {
                                    success: true,
                                    statusCode: HttpStatus.BAD_REQUEST,
                                    statusMessage: `This task is blocked by ${mapSourceTasks.get(f.source_rid)?.task_name}. Please complete that task before proceeding.`
                                }
                            }
                        } else {
                            return {
                                success: false,
                                statusCode: HttpStatus.BAD_REQUEST,
                                statusMessage: null
                            }
                        }
                    }
                }
            }
        }
    }

    async fetchAssignedToRole(assignedTo: string, caseRid: string, accountRid: string, accountNumber: string) {
        const { CaseTeam } = await this.caseModelService.getModels(accountNumber);
        const result = await CaseTeam.findOne({
            where: {
                case_rid: caseRid,
                account_rid: accountRid,
                user_rid: assignedTo
            }, raw: true
        });
        return result;
    }

    async isNewCollaborator(rid: string, accountNumber: string, taskType: string) {
        const { CaseTask, Activities } = await this.caseModelService.getModels(accountNumber);
        let result;
        if (taskType === 'activity') {
            result = await Activities.findOne({
                where: {
                    assigned_to: rid
                },
                raw: true
            });
        } else {
            result = await CaseTask.findOne({
                where: {
                    assigned_to: rid
                },
                raw: true
            });
        }
        if (result) return result;
        else return null
    }

    async isCollaboratorAlreadyAdded(assignedTo: string, caseRid: string, accountRid: string, taskRid: string, accountNumber: string, taskType: string) {
        const { TaskCollaborators } = await this.caseModelService.getModels(accountNumber);
        const whereClause: any = {
            assigned_to: assignedTo,
            account_rid: accountRid,
            task_rid: taskRid
        };
        if (taskType !== 'activity') {
            whereClause.case_rid = caseRid;
        }
        const result = await TaskCollaborators.findOne({
            where: whereClause,
            raw: true
        });
        if (result) return result;
        else return null;
    }

    async createOrUpdateTags(taskRid: string, accountRid: string, caseRid: string, tagRid: string, isNewTag: boolean, accountNumber: string, userId: string, activeStatusRid: string, taskType?: string) {
        const { Tags, TaskTag, CaseHistory, CaseTimeline } = await this.caseModelService.getModels(accountNumber)

        if (isNewTag) {
            const isTagExists = await Tags.findOne({
                where: {
                    tag_name: {
                        [Op.iLike]: tagRid
                    }
                }, raw: true
            });
            if (!isTagExists) {
                const result = await Tags.create({
                    tag_name: tagRid,
                    created_by: userId,
                    created_datetime: new Date(),
                    status_rid: activeStatusRid
                })
                if (result) {
                    const tagPayload: any = {
                        task_rid: taskRid,
                        account_rid: accountRid,
                        tag_rid: result.dataValues.rid,
                        created_by: userId,
                        created_datetime: new Date()
                    };
                    if (taskType !== "activity") {
                        tagPayload.case_rid = caseRid || "";
                    }
                    const finalResult = await TaskTag.create(tagPayload);
                    if (finalResult) {
                        if (taskType !== "activity") {
                            await CaseTimeline.create({
                                created_by: userId,
                                created_datetime: new Date(),
                                account_rid: accountRid,
                                entity_rid: finalResult.dataValues.rid,
                                event_name: `Tag added for Task`,
                                event_type: "ui handler",
                                event_status: "success",
                                event_datetime: new Date(),
                                description: `Tag added for task : ${result.tag_name}`

                            })
                            await CaseHistory.create({
                                case_rid: caseRid,
                                created_by: userId,
                                created_datetime: new Date(),
                                attribute_name: "tag_rid",
                                new_value: result.tag_name,
                                task_rid: taskRid
                            })
                        }
                        else {
                            await this.addTaskTimeline(accountNumber, taskRid, accountRid, `Tag added for task : ${result.tag_name}`, userId, "Tag added for Task", "success", taskRid);
                            await TaskHistory.create({
                                task_rid: taskRid,
                                created_by: userId,
                                created_datetime: new Date(),
                                attribute_name: "tag_rid",
                                new_value: result.tag_name
                            })
                        }
                        return {
                            statusCode: HttpStatus.SUCCESS,
                            data: finalResult
                        }
                    } else {
                        return {
                            statusCode: HttpStatus.FAILED,
                            data: null
                        }
                    }
                }
                else {
                    return {
                        statusCode: HttpStatus.FAILED,
                        data: null
                    }
                }
            } else {
                return {
                    statusCode: HttpStatus.FAILED,
                    data: STATUS_MESSAGE.tagMappedAlready
                }
            }
        }
        else {
            const tagDetails = await Tags.findOne({ where: { rid: tagRid }, raw: true })
            const isTagMapped = await this.isTagAlreadyMapped(accountNumber, taskRid, accountRid, caseRid, tagRid);
            if (!isTagMapped) {
                const finalResult = await TaskTag.create({
                    task_rid: taskRid,
                    account_rid: accountRid,
                    case_rid: caseRid,
                    tag_rid: tagRid,
                    created_by: userId,
                    created_datetime: new Date()
                })
                if (taskType !== "activity") {
                    await CaseTimeline.create({
                        created_by: userId,
                        created_datetime: new Date(),
                        account_rid: accountRid,
                        entity_rid: finalResult.dataValues.rid,
                        event_name: `Tag added for Task`,
                        event_type: "ui handler",
                        event_status: "success",
                        event_datetime: new Date(),
                        description: `Tag added for task : ${tagDetails!.tag_name}`
                    })
                    await CaseHistory.create({
                        case_rid: caseRid,
                        created_by: userId,
                        created_datetime: new Date(),
                        attribute_name: "tag_rid",
                        new_value: tagDetails!.tag_name,
                        task_rid: taskRid
                    })
                }

                if (finalResult) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        data: finalResult
                    }
                } else {
                    return {
                        statusCode: HttpStatus.FAILED,
                        data: null
                    }
                }
            } else {
                return {
                    statusCode: HttpStatus.FAILED,
                    data: STATUS_MESSAGE.tagMappedAlready
                }
            }
        }
    }

    async taskWorkflowConnector(accountNumber: string, data: CaseTaskWorkFlowCreate, transaction: Transaction) {
        if (!this.orgDbSequelize) {
            this.orgDbSequelize = await initOrgSequelize();
        }
        const { CaseTaskWorkflowConnector, CaseTask, CaseTimeline, CaseHistory, WorkflowConnector } = await this.caseModelService.getModels(accountNumber);
        let taskIds: string[] = []
        let iterationCount: number = 0;
        let totalIteration = data.target_rid.length
        const workFlowConnectorData = await WorkflowConnector.findOne({
            where: {
                rid: data.relationship_connector_rid
            }, raw: true
        })
        let workFlowConnectorDetails;
        let dynamicRelationTypeName: string = ``
        if (workFlowConnectorData) {
            if (workFlowConnectorData.relationship_type === 'Blocks') {
                dynamicRelationTypeName = relationshipTypes.isBlockedBy
            } else if (workFlowConnectorData.relationship_type === 'Enables') {
                dynamicRelationTypeName = relationshipTypes.isEnabledBy
            } else if (workFlowConnectorData.relationship_type === 'Is Enabled By') {
                dynamicRelationTypeName = relationshipTypes.enables
            } else if (workFlowConnectorData.relationship_type === 'Is Blocked By') {
                dynamicRelationTypeName = relationshipTypes.blocks
            }
        }
        workFlowConnectorDetails = await WorkflowConnector.findOne({ where: { relationship_type: dynamicRelationTypeName }, raw: true })
        for (let d of data.target_rid) {
            iterationCount += 1
            taskIds.push(data.source_rid)
            taskIds.push(d)
            const pushToSetIds = [...new Set(taskIds.map((d: string) => d))]
            const fetchTasks = await CaseTask.findAll({
                attributes: ['rid', 'task_name'],
                where: {
                    rid: {
                        [Op.in]: pushToSetIds
                    }
                }, raw: true
            })
            if (fetchTasks.length > 0 && workFlowConnectorData) {
                const taskMap = new Map(fetchTasks.map((d: any) => [d.rid, d.task_name]));
                const checkIsAlreadyMapped = await CaseTaskWorkflowConnector.findOne({
                    where: {
                        case_rid: data.case_rid,
                        account_rid: data.account_rid,
                        source_rid: data.source_rid,
                        target_rid: d,
                        relationship_connector_rid: data.relationship_connector_rid
                    }, raw: true
                });
                if (!checkIsAlreadyMapped) {
                    const ids: any[] = []
                    ids.push(data.relationship_connector_rid)
                    ids.push(workFlowConnectorDetails!.rid)
                    const result = await CaseTaskWorkflowConnector.create({
                        created_by: data.created_by,
                        created_datetime: new Date(),
                        case_rid: data.case_rid,
                        account_rid: data.account_rid,
                        source_rid: data.source_rid,
                        target_rid: d,
                        relationship_connector_rid: data.relationship_connector_rid
                    }, { transaction });
                    if (result) {
                        if (workFlowConnectorDetails) {
                            const checkForMapping = await CaseTaskWorkflowConnector.findOne({
                                where: {
                                    case_rid: data.case_rid,
                                    account_rid: data.account_rid,
                                    source_rid: d,
                                    target_rid: data.source_rid,
                                    relationship_connector_rid: workFlowConnectorDetails.rid!
                                }, raw: true
                            });
                            if (!checkForMapping) {
                                await CaseTaskWorkflowConnector.create({
                                    created_by: data.created_by,
                                    created_datetime: new Date(),
                                    case_rid: data.case_rid,
                                    account_rid: data.account_rid,
                                    source_rid: d,
                                    target_rid: data.source_rid,
                                    relationship_connector_rid: workFlowConnectorDetails.rid!
                                }, { transaction });
                            }
                        }
                        await CaseTimeline.create({
                            created_by: data.created_by,
                            created_datetime: new Date(),
                            account_rid: data.account_rid,
                            entity_rid: data.source_rid,
                            event_name:
                                `Case Task Workflow Connector created`,
                            event_type: "ui handler",
                            event_status: "success",
                            event_datetime: new Date(),
                            description: `${taskMap.get(data.source_rid)} ${workFlowConnectorData.relationship_type} ${taskMap.get(d)}`
                        }, { transaction });
                        await CaseHistory.create({
                            created_by: data.created_by,
                            created_datetime: new Date(),
                            case_rid: data.case_rid,
                            attribute_name: data.relationship_connector_rid,
                            new_value: `${taskMap.get(data.source_rid)} ${workFlowConnectorData.relationship_type} ${taskMap.get(d)}`
                        }, { transaction });
                    }
                }
            }
            else {
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    statusMessage: STATUS_MESSAGE.taskNotFound
                }
            }
        }
        if (iterationCount === totalIteration) {
            return {
                statusCode: HttpStatus.SUCCESS,
                statusMessage: STATUS_MESSAGE.workflowConnectorMappedSuccess
            }
        } else {
            return {
                statusCode: HttpStatus.FAILED,
                statusMessage: STATUS_MESSAGE.workflowConnectorMappedFailed
            }
        }
    }

    async deleteTaskWorkConnector(accountNumber: string, data: CaseTaskWorkFlowCreate) {
        const { CaseTaskWorkflowConnector, CaseTimeline, WorkflowConnector } = await this.caseModelService.getModels(accountNumber);
        if (data.delete_target_rids.length > 0) {
            let workFlowConnectorDetails;
            let deletedId: string;
            let dynamicRelationTypeName: string = ``
            const workFlowConnectorData = await WorkflowConnector.findOne({
                where: {
                    rid: data.relationship_connector_rid
                }, raw: true
            })
            if (workFlowConnectorData) {
                if (workFlowConnectorData.relationship_type === 'Blocks') {
                    dynamicRelationTypeName = relationshipTypes.isBlockedBy
                } else if (workFlowConnectorData.relationship_type === 'Enables') {
                    dynamicRelationTypeName = relationshipTypes.isEnabledBy
                } else if (workFlowConnectorData.relationship_type === 'Is Enabled By') {
                    dynamicRelationTypeName = relationshipTypes.enables
                } else if (workFlowConnectorData.relationship_type === 'Is Blocked By') {
                    dynamicRelationTypeName = relationshipTypes.blocks
                }
            }
            workFlowConnectorDetails = await WorkflowConnector.findOne({
                where: {
                    relationship_type: dynamicRelationTypeName
                }, raw: true
            })
            for (let d of data.delete_target_rids) {
                const checkDataExists = await CaseTaskWorkflowConnector.findOne({
                    where: {
                        source_rid: data.source_rid,
                        target_rid: d,
                        account_rid: data.account_rid,
                        case_rid: data.case_rid,
                        relationship_connector_rid: data.relationship_connector_rid
                    }, raw: true
                });
                if (checkDataExists) {
                    deletedId = checkDataExists.rid!
                    if (workFlowConnectorDetails) {
                        const deleteData = await CaseTaskWorkflowConnector.destroy({
                            where: {
                                case_rid: data.case_rid,
                                account_rid: data.account_rid,
                                source_rid: checkDataExists.target_rid,
                                target_rid: checkDataExists.source_rid,
                                relationship_connector_rid: workFlowConnectorDetails.rid
                            }
                        });
                        if (deleteData === 1) {
                            await CaseTaskWorkflowConnector.destroy({
                                where: {
                                    source_rid: data.source_rid,
                                    target_rid: d,
                                    account_rid: data.account_rid,
                                    case_rid: data.case_rid,
                                    relationship_connector_rid: data.relationship_connector_rid
                                }
                            })
                            await CaseTimeline.create({
                                created_by: data.created_by,
                                created_datetime: new Date(),
                                account_rid: data.account_rid,
                                entity_rid: deletedId,
                                event_name:
                                    `Case Task Workflow Connector deleted`,
                                event_type: "ui handler",
                                event_status: "success",
                                event_datetime: new Date(),
                                description: ``
                            });
                            return {
                                statusCode: HttpStatus.SUCCESS,
                                statusMessage: STATUS_MESSAGE.workflowConnectorMappedDeleted
                            }
                        } else {
                            return {
                                statusCode: HttpStatus.FAILED,
                                statusMessage: STATUS_MESSAGE.workflowConnectorMappedDeletedFailed
                            }
                        }
                    }
                } else {
                    return {
                        statusCode: HttpStatus.NOT_FOUND,
                        statusMessage: STATUS_MESSAGE.dataNotAvailable
                    }
                }
            }
        }
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
            }
            else {
                const attachmentLevel = entityresponse?.attachment_level || "case";
                if (!this.orgDbSequelize) {
                    this.orgDbSequelize = await this.caseModelService.getSequelize();
                }
                const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
                    /\D/g,
                    ""
                )}`;
                let insertQuery = "";
                console.log("In add task timeline...", entity_rid, accountRid, attachmentLevel);
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
                }
                else if (attachmentLevel === "project") {
                    insertQuery = rawQueries.insertTimeline(schemaName, "project_timeline");
                }
                else if (attachmentLevel === "project_resource") {
                    insertQuery = rawQueries.insertTimeline(schemaName, "project_resource_timeline");
                }
                else if (attachmentLevel === "project_task") {
                    insertQuery = rawQueries.insertTimeline(schemaName, "project_task_timeline");
                }
                else if (attachmentLevel === "resource") {
                    insertQuery = rawQueries.insertTimeline(schemaName, "resource_timeline");
                }
                else {
                    insertQuery = rawQueries.insertTimeline(schemaName, "account_timeline");
                }


                await this.orgDbSequelize.query(insertQuery, {
                    type: QueryTypes.INSERT,
                    replacements: {
                        event_name: eventName,
                        event_status: eventStatus,
                        event_type: "ui handler",
                        entity_rid: entity_rid || "",
                        description: description,
                        created_by: userId,
                        event_datetime: new Date(),
                        created_datetime: new Date()
                    }
                });
            }
        } catch (err) {
            logMessage(`Error creating case team timeline: ${err}`);
        }
    }

    async isTagAlreadyMapped(accountNumber: string, taskRid: string, accountRid: string, caseRid: string, tagRid: string) {
        const { TaskTag } = await this.caseModelService.getModels(accountNumber);
        const whereClause: any = {
            account_rid: accountRid,
            task_rid: taskRid,
            tag_rid: tagRid
        };
        if (caseRid) {
            whereClause.case_rid = caseRid;
        }
        const result = await TaskTag.findOne({
            where: whereClause,
            raw: true
        });
        if (result) return result;
        else return null;
    }

}

export default CaseSchemaService;
