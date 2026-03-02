import { Op, QueryTypes, Sequelize, Transaction } from "sequelize";
import { AddCommentsType, CaseTaskQueryType, CaseTaskWorkFlowCreate, CreateCaseTaskType, DeleteCommentsType, FilterType, UpdateCaseTaskType, UpdateCommentsType, WeightageType } from "../../../utils/types";
import { CaseModelService } from "../../caseModelsService";
import { v4 as uuidv4 } from 'uuid'
import { entityNames, entityTypes, ENV_PREFIX, eventNames, eventTypes, HttpStatus, MAIN_SCHEMA_NAME, rawQueries, relationshipTypes, ruleNames, ruleTemplateNames, STATUS_MESSAGE } from "../../../utils/constants";
import { HelperMethods } from "../helperMethods";
import { initMainDbSequelize } from "../../../config/mainDataSource";
import CaseSchemaService from "../schemaService";
import { deleteFromAzureBlob, generateSasUrl, getColumnsNamesForTaskCommentsUpdate, getColumnsNamesForTaskUpdate, logMessage, uploadToAzureBlob } from "../../../utils/helpers";
import { initOrgSequelize } from "../../../config/orgDataSource";
import { fetchCaseSpecificTaskQuery } from "../../../utils/rawQueries";
import { TaskTag } from "../../../models/taskTagsModel";
import { CaseHistory } from "../../../models/caseHistory";
import { CaseTimeline } from "../../../models/caseTimeline";
import { TaskCollaborators } from "../../../models/taskCollaboratorsModel";
import { CaseTaskWorkflowConnector } from "../../../models/caseTaskWorkflowConnectorModel";
import { CaseTask } from "../../../models/caseTaskModel";
import { findTaskWeightageDetails, getCompletedTaskStatusId } from "../../../utils/rdFinancialWorkingQueries";
import Decimal from "decimal.js";


export class CaseTaskSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService
  private helperMethod: HelperMethods

  constructor() {
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService()
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
  }
  async createUserLevelTask(
    data: CreateCaseTaskType,
    accountNumber: string,
    transaction: Transaction,
    activeStatusRid: string,
    fiscalYear: number
  ) {
    const { CaseTask, CaseTimeline, TaskSummary, Case, CaseHistory } =
      await this.caseModelService.getModels(accountNumber);
    const fetchSequenceNumber = await this.fetchSequenceOrder(
      data.milestone_template_rid,
      accountNumber
    );
    let sequenceNo: number = 0;
    if (fetchSequenceNumber.length > 0) {
      sequenceNo = fetchSequenceNumber[0]?.sequence_no! + 1;
    } else {
      sequenceNo = 0;
    }
    const createdTaskResult = await CaseTask.create(
      {
        rid: `${ENV_PREFIX}${uuidv4()}`,
        created_by: data.created_by,
        created_datetime: new Date(),
        task_name: data.task_name,
        sequence_no: sequenceNo,
        effective_start_datetime: data.effective_start_datetime,
        effective_end_datetime: data.effective_end_datetime,
        case_team_member_role_rid: data.case_team_member_role_rid,
        assigned_to: data.assigned_to,
        status_rid: activeStatusRid,
        priority_rid: data.priority_rid,
        milestone_template_rid: data.milestone_template_rid,
        checklist_template_rid: data.checklist_template_rid,
        account_rid: data.account_rid,
        case_rid: data.case_rid,
        task_type_rid: data.task_type_rid,
        task_description: data.task_description,
        task_status_rid: data.task_status_rid,
        weightage_rid: data.weightage_rid,
        task_category_rid: data.task_category_rid,
      },
      { transaction }
    );
    if (createdTaskResult) {
      const caseInfo = await Case.findOne({
        where: {
          rid: data.case_rid,
          account_rid: data.account_rid,
        },
        attributes: ["case_name", "fiscal_year"],
        raw: true,
      });
      await TaskSummary.create({
        task_rid: createdTaskResult.dataValues.rid,
        r_number: createdTaskResult.r_number || "",
        account_rid: createdTaskResult.account_rid || "",
        attach_to: data.case_rid || "",
        attachment_level: "case",
        task_name: data.task_name || "",
        description: data.task_description || "",
        fiscal_year: caseInfo?.fiscal_year || 0,
        assigned_to: data.assigned_to || "",
        status_rid: data.task_status_rid || "",
        priority_rid: data.priority_rid || "",
        effective_start_datetime: data.effective_start_datetime,
        effective_end_datetime: data.effective_end_datetime,
        created_by: data.created_by || "",
        created_datetime: new Date(),
        task_type_rid: data.task_type_rid || "",
        task_category_rid: data.task_category_rid || "",
        case_team_member_role_rid: data.case_team_member_role_rid
      });
      if (data?.checklist_template_rid) {
        const response = await this.helperMethod.fetchChecklistTemplateDetailsById(
          data.checklist_template_rid
        );
        response.checklist_items.map((item: any) => (item.action_type = "add"));
        let caseRequest = {
          account_rid: data.account_rid!,
          checklist_name: response.checklist_name,
          checklist_description: response.description,
          checklist_items: response.checklist_items,
          attach_to: createdTaskResult.dataValues.rid,
          attachment_level: "task",
          created_by: data.created_by,
          created_datetime: new Date(),
          fiscal_year: fiscalYear,
          checklist_rid: data.checklist_template_rid,
          case_rid: data.case_rid,
        };

        const checklistResponse = await this.helperMethod.createCheckListForTask(
          accountNumber,
          caseRequest,
          transaction
        );
        if (checklistResponse)
          await this.helperMethod.manageCheckListItems(
            accountNumber,
            caseRequest,
            checklistResponse.rid,
            transaction
          );
      }
      if (data.tags.length > 0) {
        for (let d of data.tags) {
          await this.createOrUpdateTags(
            createdTaskResult.dataValues.rid,
            data.account_rid,
            data.case_rid,
            d.tag_rid,
            d.is_new_tag,
            accountNumber,
            data.created_by,
            activeStatusRid,
            "case_task"
          );
        }
      }
      if (Object.keys(data.workflow_connector).length > 0) {
        if (data.workflow_connector.target_rid.length > 0) {
          data.workflow_connector.created_by = data.created_by;
          data.workflow_connector.case_rid = data.case_rid;
          data.workflow_connector.source_rid = createdTaskResult.dataValues.rid;
          data.workflow_connector.account_rid = data.account_rid;
          const workflowResult = await this.taskWorkflowConnector(
            accountNumber,
            data.workflow_connector,
            transaction
          );
          if (workflowResult.statusCode === HttpStatus.BAD_REQUEST) {
            return {
              statusCode: HttpStatus.BAD_REQUEST,
              statusMessage: workflowResult.statusMessage,
            };
          }
        }
      }
      const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
        userId: data.created_by,
        eventType: eventTypes.UI_HANDLER
      });
      await CaseTimeline.create(
        {
          created_by_name: userEventInfo.full_name,
          event_type_rid: userEventInfo.event_type_rid,
          created_by: data.created_by,
          created_datetime: new Date(),
          account_rid: data.account_rid,
          entity_rid: createdTaskResult.dataValues.rid,
          case_rid: data.case_rid,
          event_name: eventNames.CREATE,
          entity_name: entityTypes.TASK,
          descriptions: `${createdTaskResult.task_name}`,
        },
        { transaction }
      );
      await CaseHistory.create({
        created_by: data.created_by,
        created_datetime: new Date(),
        case_rid: data.case_rid,
        task_rid: createdTaskResult.dataValues.rid,
        attribute_name: "Task",
        old_value: "CREATE",
        new_value: `added a task ${createdTaskResult.task_name}`,
      });
      return {
        statusCode: HttpStatus.SUCCESS,
        data: createdTaskResult,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        data: {},
      };
    }
  }

  async updateUserLevelTask(data: UpdateCaseTaskType, accountNumber: string, transaction: Transaction, activeStatusRid: string, accessToken: string) {
    try {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await initMainDbSequelize()
      }
      const { CaseTask, CaseTimeline, CaseHistory, TaskCollaborators, TaskSummary, CheckList, CheckListItem, Case } = await this.caseModelService.getModels(accountNumber);
      const checkCaseExists = await this.caseSchemaService.isCaseExistsForAccount(data.account_rid, data.case_rid, accountNumber);
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
            if (Object.keys(data.workflow_connector).length > 0) {
              const workflowResult = await this.checkTaskWorkFlow(accountNumber, data.rid, data.task_status_rid, data.case_rid, data.workflow_connector.target_rid);
              if (workflowResult?.success) {
                return {
                  statusCode: HttpStatus.BAD_REQUEST,
                  statusMessage: workflowResult.statusMessage
                }
              }
            }
            const [currentStatus]: any[] = await this.mainDbSequelize.query(rawQueries.fetchTaskStatus(isTaskExists.task_status_rid, data.task_status_rid), { type: QueryTypes.SELECT });
            if (currentStatus === 'Closed') {
              data.is_flagged = false;
            }
          }
          if (data.assigned_to !== null && data.assigned_to !== '' && data.assigned_to !== undefined) {
            if (data.assigned_to !== isTaskExists.assigned_to) {
              const findUserRoleId = await this.caseSchemaService.fetchAssignedToRole(data.assigned_to, data.case_rid, data.account_rid, accountNumber);
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
          const [caseInfo]: any[] = await this.mainDbSequelize.query(
            rawQueries.fetchCasesInfo(data.case_rid),
            {
              replacements: { case_rid: data.case_rid },
              type: "SELECT"
            });
          let baseRuleEnginePayload: any = {
            userId: data.modified_by,
            accountRid: data.account_rid,
            taskName: data.task_name,
            entityRid: data.rid,
            eventName: ruleNames.taskCreated,
            entity: entityNames.task,
            caseName: caseInfo ? caseInfo.case_name : ""
          };

          if (data?.checklist_template_rid) {
            if (data.checklist_template_rid !== isTaskExists.checklist_template_rid) {
              if (isTaskExists.checklist_template_rid !== null && isTaskExists.checklist_template_rid !== '') {
                const checklistResult = await CheckList.findOne({
                  where: {
                    attach_to: data.rid,
                    case_rid: data.case_rid,
                    attachment_level: 'task',
                    checklist_template_rid: isTaskExists.checklist_template_rid
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
                      attach_to: data.rid,
                      case_rid: data.case_rid,
                      attachment_level: 'task',
                      checklist_template_rid: isTaskExists.checklist_template_rid
                    }
                  })
                }
              }
              const response = await this.helperMethod.fetchChecklistTemplateDetailsById(data.checklist_template_rid);
              response.checklist_items.map((item: any) => item.action_type = 'add');
              let caseRequest: any = {
                account_rid: data.account_rid!,
                checklist_name: response.checklist_name,
                checklist_description: response.description,
                checklist_items: response.checklist_items,
                attach_to: data.rid,
                attachment_level: 'task',
                created_by: data.modified_by,
                created_datetime: new Date(),
                fiscal_year: checkCaseExists.fiscal_year,
                checklist_rid: data.checklist_template_rid,
                case_rid: data.case_rid
              };
              const checklistResponse = await this.helperMethod.createCheckListForTask(accountNumber, caseRequest, transaction);
              if (checklistResponse)
                await this.helperMethod.manageCheckListItems(accountNumber, caseRequest, checklistResponse.rid, transaction);
            }
          }
          await TaskSummary.update(
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
              task_category_rid: data.task_category_rid || ""
            },
            {
              where: {
                task_rid: data.rid,
                attach_to: data.case_rid
              }
            }
          );
          const checkIsDifferentCollaborator = await this.isNewCollaborator(data.modified_by, accountNumber, "case_task", data.case_rid, data.rid);
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
              if (data.workflow_connector.target_rid !== undefined && data.workflow_connector.is_new_changes) {
                if (data.workflow_connector.target_rid.length > 0)
                  await this.taskWorkflowConnector(accountNumber, data.workflow_connector, transaction);
              }
              if (data.workflow_connector.delete_target_rids !== undefined) {
                if (data.workflow_connector.delete_target_rids.length > 0 && data.workflow_connector.is_new_changes) {
                  data.workflow_connector.source_rid = data.rid
                  await this.deleteTaskWorkConnector(accountNumber, data.workflow_connector)
                }
              }
              if (data.workflow_connector.is_new_changes) {
                const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                  userId: data.modified_by,
                  eventType: eventTypes.UI_HANDLER
                });
                // await CaseTimeline.create({
                //   created_by: data.modified_by,
                //   created_datetime: new Date(),
                //   created_by_name: userEventInfo.full_name,
                //   event_type_rid: userEventInfo.event_type_rid,
                //   account_rid: data.account_rid,
                //   entity_rid: data.case_rid,
                //   event_name:
                //     `Case Task Workflow Connector updated`,
                //   event_type: "ui handler",
                //   event_status: "success",
                //   event_datetime: new Date(),
                //   description: `Case Task Workflow Connector updated`
                // }, { transaction });
                await CaseHistory.create({
                  created_by: data.modified_by,
                  created_datetime: new Date(),
                  case_rid: data.case_rid,
                  attribute_name: "Linked Items",
                  old_value: "CREATE",
                  new_value: `updated the ${data.workflow_connector.key_name}`,
                  task_rid: data.rid
                }, { transaction });
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
              let labelName;
              for (let c of fetchUpdatedColumns) {
                oldValue = (isTaskExists as any)[c]
                newValue = (data as any)[c]
                columnName = c

                if (columnName == "assigned_to") {
                  labelName = "Assigned To"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchUserNames(oldValue, newValue))
                  let emailMapping: Map<string, string> = new Map()
                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.name)
                    emailMapping.set(r.rid, r.email)
                  }
                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue)
                  baseRuleEnginePayload.targetUserID = newValue;
                  baseRuleEnginePayload.targetEmail = emailMapping.get(newValue);
                  baseRuleEnginePayload.task = "Assigned";

                  logMessage(`Triggering rule engine for assignee change with payload ${JSON.stringify(baseRuleEnginePayload)}`)

                }
                else if (columnName === "checklist_template_rid") {
                  labelName = "Checklist"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchCheckLists(oldValue, newValue));
                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.checklist_name)
                  }
                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue)
                }
                else if (columnName === "priority_rid") {
                  labelName = "Priority"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchPriority(oldValue, newValue));
                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.priority_name)
                  }
                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue);
                }
                else if (columnName === "task_status_rid") {

                  labelName = "Status"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskStatus(oldValue, newValue));

                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.task_status_name)
                  }
                  if (data.assigned_to !== null && data.assigned_to !== '' && data.assigned_to !== undefined) {
                    const [userInfo]: any[] = await this.mainDbSequelize.query(rawQueries.fetchUserDetails(data.assigned_to), { type: QueryTypes.SELECT });
                    baseRuleEnginePayload.targetEmail = userInfo?.email || '';
                  }

                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue);
                  baseRuleEnginePayload.status = newValueString;
                  baseRuleEnginePayload.targetUserID = data.assigned_to;


                  // await this.helperMethod.triggerDynamicRuleEngine('status_change', baseRuleEnginePayload, {
                  //   newValue: newValueString,
                  //   oldValue: oldValueString
                  // }, accessToken);
                }
                else if (columnName === "weightage_rid") {
                  labelName = "Weightage"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskWeightage(oldValue, newValue));
                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.weightage_value)
                  }
                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue)
                }
                else if (columnName === "task_category_rid") {
                  labelName = "Task Category"
                  const result: any = await this.mainDbSequelize.query(rawQueries.fetchTaskCategory(oldValue, newValue));
                  for (let r of result[0]) {
                    columnMapping.set(r.rid, r.category_name)
                  }
                  oldValueString = columnMapping.get(oldValue)
                  newValueString = columnMapping.get(newValue)
                }
                else {
                  if (c === 'task_name') labelName = "Task Name"
                  if (c === 'task_description') labelName = "Task Description"
                  if (c === 'effective_start_datetime') labelName = "Start Date"
                  if (c === 'effective_end_datetime') labelName = "Due Date"
                  oldValueString = oldValue
                  newValueString = newValue
                }
                await CaseHistory.create({
                  created_by: data.modified_by,
                  created_datetime: new Date(),
                  case_rid: data.case_rid,
                  attribute_name: labelName!,
                  old_value: oldValueString,
                  new_value: newValueString,
                  task_rid: data.rid
                })
                updatedColumnsStorage.push(`${oldValue} changed to ${newValue}`);
              }

              if (updatedColumnsStorage.length > 0) {
                combinedColumns = updatedColumnsStorage.join(', ')
              }
              const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                userId: data.modified_by,
                eventType: eventTypes.UI_HANDLER
              });

              await CaseTimeline.create({
                created_by_name: userEventInfo.full_name,
                event_type_rid: userEventInfo.event_type_rid,
                created_by: data.modified_by,
                created_datetime: new Date(),
                account_rid: data.account_rid,
                entity_rid: data.rid,
                case_rid: data.case_rid,
                event_name: eventNames.UPDATE,
                entity_name: entityTypes.TASK,
                descriptions: `${data.task_name}`
              })
            }
            await transaction.commit();
            const findAllTaskByCaseIds = await CaseTask.findAll({
              attributes: ['weightage_rid', 'task_status_rid'],
              where: {
                case_rid: data.case_rid
              },
              raw: true
            });
            if (findAllTaskByCaseIds.length > 0) {
              const allTasksWeightageIds = [...new Set(findAllTaskByCaseIds.map((d: CaseTask) => d.weightage_rid!))];
              const findCompletedTaskStatus: any = await this.mainDbSequelize.query(getCompletedTaskStatusId());
              const completedTaskStatusId = findCompletedTaskStatus[0][0].rid
              const allCompletedTaskWeightageIds = findAllTaskByCaseIds.filter((d: CaseTask) => d.task_status_rid === completedTaskStatusId).map((f: CaseTask) => f.weightage_rid!)
              const findWeightageValues = await this.mainDbSequelize.query<WeightageType>(findTaskWeightageDetails(allTasksWeightageIds), { type: QueryTypes.SELECT });
              if (findWeightageValues.length > 0) {
                const mapAllWeightageWithValue = new Map(findWeightageValues.map((d: WeightageType) => [d.rid, d.weightage_value]));
                let totalAllWeightageValues: Decimal = new Decimal(0)
                let completedWeightValues: Decimal = new Decimal(0)
                findAllTaskByCaseIds.forEach((data: CaseTask) => {
                  if (mapAllWeightageWithValue.get(data.weightage_rid!) !== undefined) {
                    totalAllWeightageValues = totalAllWeightageValues.add(mapAllWeightageWithValue.get(data.weightage_rid!)!)
                  }
                });
                allCompletedTaskWeightageIds.forEach((data: any) => {
                  if (mapAllWeightageWithValue.get(data!) !== undefined) {
                    completedWeightValues = completedWeightValues.add(mapAllWeightageWithValue.get(data!)!)
                  }
                })
                const caseCompletionPercentage = (completedWeightValues.div(totalAllWeightageValues)).mul(100) || new Decimal(0)
                await Case.update({
                  case_completion_percentage: parseFloat(caseCompletionPercentage.toFixed(2))
                }, {
                  where: {
                    rid: data.case_rid
                  }
                })
              }
            }
            await this.helperMethod.triggerDynamicRuleEngine(baseRuleEnginePayload, {
              newValue: "newValueString",
              oldValue: "oldValueString"
            }, accessToken);
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
    } catch (error) {
      console.log(error)
      logMessage(`Error in updateUserLevelTask: ${error}`);
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: 'Task update failed due to an unexpected error.'
      }
    }
  }

  async fetchSequenceOrder(
    milestone_template_rid: string,
    accountNumber: string
  ) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber);
    const findSequenceOrder = await CaseTask.findAll({
      attributes: ["sequence_no"],
      where: {
        milestone_template_rid: milestone_template_rid,
      },
      order: [["created_datetime", "DESC"]],
      raw: true,
    });
    return findSequenceOrder;
  }
  async findTaskById(
    rid: string,
    accountRid: string,
    caseRid: string,
    accountNumber: string,
    taskType?: string
  ) {
    const { CaseTask, Activities } = await this.caseModelService.getModels(
      accountNumber
    );
    if (taskType === "activity") {
      const checkTaskExists = await Activities.findOne({
        where: {
          rid: rid,
          account_rid: accountRid,
        },
        raw: true,
      });
      if (checkTaskExists) return checkTaskExists;
      else return null;
    } else {
      const checkTaskExists = await CaseTask.findOne({
        where: {
          rid: rid,
          account_rid: accountRid,
          case_rid: caseRid,
        },
        raw: true,
      });
      if (checkTaskExists) return checkTaskExists;
      else return null;
    }
  }
  async checkTaskExistsForUserLevelTask(
    data: any,
    taskTypeRid: string,
    accountNumber: string
  ) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber);
    const checkTaskNameExists = await CaseTask.findOne({
      attributes: ["task_name"],
      where: {
        task_name: {
          [Op.iLike]: data.task_name,
        },
        case_rid: data.case_rid,
        account_rid: data.account_rid,
        task_type_rid: taskTypeRid,
      },
      raw: true,
    });
    return checkTaskNameExists;
  }
  async checkTaskNameExistsForUpdate(
    data: UpdateCaseTaskType,
    accountNumber: string,
    eid: string
  ) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber);
    const checkTaskExists = await CaseTask.findOne({
      attributes: ["rid"],
      where: {
        task_name: {
          [Op.iLike]: data.task_name,
        },
        eid: {
          [Op.notIn]: [eid],
        },
        account_rid: {
          [Op.in]: [data.account_rid],
        },
        case_rid: {
          [Op.in]: [data.case_rid],
        },
      },
      raw: true,
    });
    if (checkTaskExists) return checkTaskExists;
    else return null;
  }
  async fetchTaskForCases(
    page: number,
    limit: number,
    search: string,
    sort: string,
    sortBy: string,
    filter: FilterType,
    doSorting: boolean,
    caseRid: string,
    accountRid: string,
    schemaName: string,
    isExport: boolean,
    disablePagination: boolean
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const activeStatusId: any = await this.mainDbSequelize.query(
      rawQueries.getActiveStatusId()
    );
    const result = await this.orgDbSequelize.query<CaseTaskQueryType>(
      fetchCaseSpecificTaskQuery(
        page,
        limit,
        search,
        sort,
        sortBy,
        filter,
        doSorting,
        caseRid,
        accountRid,
        schemaName,
        isExport,
        activeStatusId[0][0].rid,
        disablePagination
      ),
      { type: QueryTypes.SELECT }
    );
    if (result.length > 0) {
      return result;
    } else {
      return [];
    }
  }
  async isNewCollaborator(
    rid: string,
    accountNumber: string,
    taskType: string,
    caseRid?: string,
    taskRid?: string
  ) {
    const { CaseTask, Activities } = await this.caseModelService.getModels(
      accountNumber
    );
    let result;
    if (taskType === "activity") {
      result = await Activities.findOne({
        where: {
          assigned_to: rid,
        },
        raw: true,
      });
    } else {
      result = await CaseTask.findOne({
        where: {
          assigned_to: rid,
          case_rid: caseRid,
          rid: taskRid,
        },
        raw: true,
      });
    }
    if (result) return result;
    else return null;
  }
  async isCollaboratorAlreadyAdded(
    assignedTo: string,
    caseRid: string,
    accountRid: string,
    taskRid: string,
    accountNumber: string,
    taskType: string
  ) {
    const { TaskCollaborators } = await this.caseModelService.getModels(
      accountNumber
    );
    const whereClause: any = {
      assigned_to: assignedTo,
      account_rid: accountRid,
      task_rid: taskRid,
    };
    if (taskType !== "activity") {
      whereClause.case_rid = caseRid;
    }
    const result = await TaskCollaborators.findOne({
      where: whereClause,
      raw: true,
    });
    if (result) return result;
    else return null;
  }
  async createOrUpdateTags(
    taskRid: string,
    accountRid: string,
    caseRid: string,
    tagRid: string,
    isNewTag: boolean,
    accountNumber: string,
    userId: string,
    activeStatusRid: string,
    taskType?: string
  ) {
    const { Tags, TaskTag, CaseHistory, CaseTimeline, ActivityHistory } =
      await this.caseModelService.getModels(accountNumber);

    if (isNewTag) {
      const isTagExists = await Tags.findOne({
        where: {
          tag_name: {
            [Op.iLike]: tagRid,
          },
        },
        raw: true,
      });
      if (!isTagExists) {
        const result = await Tags.create({
          tag_name: tagRid,
          created_by: userId,
          created_datetime: new Date(),
          status_rid: activeStatusRid,
        });
        if (result) {
          const tagPayload: any = {
            task_rid: taskRid,
            account_rid: accountRid,
            tag_rid: result.dataValues.rid,
            created_by: userId,
            created_datetime: new Date(),
          };
          if (taskType !== "activity") {
            tagPayload.case_rid = caseRid || "";
          }
          const finalResult = await TaskTag.create(tagPayload);
          if (finalResult) {
            if (taskType !== "activity") {
              const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                userId: userId,
                eventType: eventTypes.UI_HANDLER
              });
              await CaseTimeline.create({
                created_by: userId,
                created_datetime: new Date(),
                account_rid: accountRid,
                entity_rid: taskRid,
                case_rid: caseRid,
                event_name: eventNames.ADDED,
                entity_name: entityTypes.TAG,
                event_type_rid: userEventInfo.event_type_rid,
                descriptions: `Task ${result.tag_name}`,
                created_by_name: userEventInfo.full_name
              });
              await CaseHistory.create({
                created_by: userId,
                created_datetime: new Date(),
                attribute_name: "Tags",
                old_value: `CREATE`,
                new_value: `added the following tags ${result.dataValues.tag_name}`,
                case_rid: caseRid,
                task_rid: taskRid,
              });
            } else {

              await this.addTaskTimeline(
                accountNumber,
                taskRid,
                accountRid,
                `Tag added for task : ${result.tag_name}`,
                userId,
                "Tag added for Task",
                "success",
                taskRid
              );
              await ActivityHistory.create({
                activity_rid: taskRid,
                account_rid: accountRid,
                created_by: userId,
                created_datetime: new Date(),
                attribute_name: "Tags",
                old_value: `CREATE`,
                new_value: `added the following tags ${result.dataValues.tag_name}`,
              });
            }
            return {
              statusCode: HttpStatus.SUCCESS,
              data: finalResult,
            };
          } else {
            return {
              statusCode: HttpStatus.FAILED,
              data: null,
            };
          }
        } else {
          return {
            statusCode: HttpStatus.FAILED,
            data: null,
          };
        }
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          data: STATUS_MESSAGE.tagMappedAlready,
        };
      }
    } else {
      const tagDetails = await Tags.findOne({
        where: { rid: tagRid },
        raw: true,
      });
      const isTagMapped = await this.isTagAlreadyMapped(
        accountNumber,
        taskRid,
        accountRid,
        caseRid,
        tagRid
      );
      if (!isTagMapped) {
        const finalResult = await TaskTag.create({
          task_rid: taskRid,
          account_rid: accountRid,
          case_rid: caseRid,
          tag_rid: tagRid,
          created_by: userId,
          created_datetime: new Date(),
        });
        if (taskType !== "activity") {
          const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
            userId: userId,
            eventType: eventTypes.UI_HANDLER
          });
          const existingTaskInfo: any = await CaseTask.findOne({
            where: {
              rid: taskRid,
              account_rid: accountRid,
              case_rid: caseRid,
            },
            raw: true,
          });
          await CaseTimeline.create({
            created_by: userId,
            created_datetime: new Date(),
            account_rid: accountRid,
            entity_rid: taskRid,
            case_rid: caseRid,
            entity_name: entityTypes.TAG,
            event_name: eventNames.UPDATE,
            // description: `Tag added for task : ${tagDetails!.tag_name}`,
            descriptions: `Task ${existingTaskInfo!.task_name}`,
            created_by_name: userEventInfo.full_name,
            event_type_rid: userEventInfo.event_type_rid,
          });
          await CaseHistory.create({
            case_rid: caseRid,
            created_by: userId,
            created_datetime: new Date(),
            attribute_name: "tag_rid",
            new_value: tagDetails!.tag_name,
            task_rid: taskRid,
          });
        } else {
          await this.addTaskTimeline(
            accountNumber,
            taskRid,
            accountRid,
            `Tag added for task : ${tagDetails!.tag_name}`,
            userId,
            "Tag added for Task",
            "success",
            taskRid
          );
          await ActivityHistory.create({
            activity_rid: taskRid,
            account_rid: accountRid,
            created_by: userId,
            created_datetime: new Date(),
            attribute_name: "Tags",
            old_value: `CREATE`,
            new_value: `added the following tags ${tagDetails!.tag_name}`,
          });
        }

        if (finalResult) {
          return {
            statusCode: HttpStatus.SUCCESS,
            data: finalResult,
          };
        } else {
          return {
            statusCode: HttpStatus.FAILED,
            data: null,
          };
        }
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          data: STATUS_MESSAGE.tagMappedAlready,
        };
      }
    }
  }
  async fetchAllTags(data: TaskTag[]) {
    const { Tags } = await this.caseModelService.getModels("");
    if (data.length > 0) {
      const result = await Tags.findAll({
        where: {
          rid: {
            [Op.notIn]: data.map((d: any) => d.tag_rid),
          },
        },
        attributes: ["rid", "tag_name"],
        order: [["tag_name", "ASC"]],
      });
      if (result.length > 0) return result;
      else return [];
    } else {
      const result = await Tags.findAll({
        attributes: ["rid", "tag_name"],
        order: [["tag_name", "ASC"]],
      });
      if (result.length > 0) return result;
      else return [];
    }
  }
  async isTagAlreadyMapped(
    accountNumber: string,
    taskRid: string,
    accountRid: string,
    caseRid: string,
    tagRid: string
  ) {
    const { TaskTag } = await this.caseModelService.getModels(accountNumber);
    const whereClause: any = {
      account_rid: accountRid,
      task_rid: taskRid,
      tag_rid: tagRid,
    };
    if (caseRid) {
      whereClause.case_rid = caseRid;
    }
    const result = await TaskTag.findOne({
      where: whereClause,
      raw: true,
    });
    if (result) return result;
    else return null;
  }
  async addComments(
    data: AddCommentsType,
    accountNumber: string,
    taskNumber: string,
    files: Express.Multer.File[],
    accountRNumber: string
  ) {
    const {
      TaskComments,
      CommentsAttachments,
      TaskAttachments,
      CaseTimeline,
      TaskCollaborators,
      ActivityHistory,
      CaseTask

    } = await this.caseModelService.getModels(accountNumber);
    const commentPayload: any = {
      created_by: data.created_by,
      created_datetime: new Date(),
      account_rid: data.account_rid,
      task_rid: data.task_rid,
      comments: data.comments,
    };
    if (data.task_type !== "activity") {
      commentPayload.case_rid = data.case_rid;
    }
    const createComments = await TaskComments.create(commentPayload);
    if (createComments) {
      const checkIsDifferentCollaborator = await this.isNewCollaborator(
        data.created_by,
        accountNumber,
        data.task_type,
        data.case_rid,
        data.task_rid
      );
      if (!checkIsDifferentCollaborator) {
        const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(
          data.created_by,
          data.case_rid,
          data.account_rid,
          data.task_rid,
          accountNumber,
          data.task_type
        );
        if (!checkCollaboratorExists) {
          const collaboratorPayload: any = {
            account_rid: data.account_rid,
            task_rid: data.task_rid,
            assigned_to: data.created_by,
            created_by: data.created_by,
            created_datetime: new Date(),
          };
          if (data.task_type !== "activity") {
            collaboratorPayload.case_rid = data.case_rid;
          }
          await TaskCollaborators.create(collaboratorPayload);
        }
      }
      if (files.length > 0) {
        for (let f of files) {
          const uploadFile = await uploadToAzureBlob(
            f,
            data.account_rid,
            taskNumber,
            accountRNumber,
            "cases"
          );
          if (uploadFile) {
            const commentsAttachmentPayload: any = {
              created_by: data.created_by,
              created_datetime: new Date(),
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              comments_rid: createComments.dataValues.rid,
              browse_file: uploadFile.url,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              document_name: uploadFile.name,
              is_file_deleted: false,
            };
            if (data.task_type !== "activity") {
              commentsAttachmentPayload.case_rid = data.case_rid;
            }
            await CommentsAttachments.create(commentsAttachmentPayload);

            const taskAttachmentPayload: any = {
              created_by: data.created_by,
              created_datetime: new Date(),
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              browse_file: uploadFile.url,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              document_name: uploadFile.name,
              is_file_deleted: false,
              comments_rid: createComments.dataValues.rid,
            };
            if (data.task_type !== "activity") {
              taskAttachmentPayload.case_rid = data.case_rid;
            }
            await TaskAttachments.create(taskAttachmentPayload);

            const caseHistoryPayload: any = {
              account_rid: data.account_rid,
              created_by: data.created_by,
              created_datetime: new Date(),
              attribute_name: "comments_attachments",
              old_value: "CREATE",
              new_value: "added a comment with attachment",
              task_rid: data.task_rid,
            };
            if (data.task_type !== "activity") {
              caseHistoryPayload.case_rid = data.case_rid;
              await CaseHistory.create(caseHistoryPayload);
            } else {
              caseHistoryPayload.activity_rid = data.task_rid;
              await ActivityHistory.create(caseHistoryPayload);
            }
          }
        }
      }
      if (data.task_type !== "activity") {
        const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
          userId: data.created_by,
          eventType: eventTypes.UI_HANDLER
        });
        const existingTaskInfo: any = await CaseTask.findOne({
          where: {
            rid: data.task_rid,
            account_rid: data.account_rid,
            case_rid: data.case_rid,
          },
          raw: true,
        });
        await CaseTimeline.create({
          created_by: data.created_by,
          created_by_name: userEventInfo.full_name,
          event_type_rid: userEventInfo.event_type_rid,
          created_datetime: new Date(),
          account_rid: data.account_rid,
          entity_rid: data.case_rid,
          case_rid: data.task_rid,
          event_name: eventNames.UPDATE,
          entity_name: entityTypes.COMMENTS,
          descriptions: `Task ${existingTaskInfo.task_name}`,
        });
        await CaseHistory.create({
          created_by: data.created_by,
          created_datetime: new Date(),
          case_rid: data.case_rid,
          task_rid: data.task_rid,
          attribute_name: "Comments",
          old_value: "CREATE",
          new_value: "added a comment",
        });
      } else {
        this.addTaskTimeline(
          accountNumber,
          createComments.dataValues.rid,
          data.account_rid,
          `Task Comments : ${createComments.comments}`,
          data.created_by,
          "Task Comments Created",
          "success",
          data.task_rid
        );
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.commentsAddedSuccess,
        data: createComments,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.commentsFailed,
        data: null,
      };
    }
  }

  async updateComments(
    data: UpdateCommentsType,
    accountNumber: string,
    taskNumber: string,
    files: Express.Multer.File[],
    accountRNumber: string
  ) {
    const {
      TaskComments,
      CommentsAttachments,
      TaskAttachments,
      TaskCollaborators,
      CaseHistory,
      CaseTimeline,
      ActivityHistory,
    } = await this.caseModelService.getModels(accountNumber);
    const isCommentExists = await TaskComments.findOne({
      where: {
        rid: data.rid,
      },
    });
    if (isCommentExists) {
      const [updateComments] = await TaskComments.update(data, {
        where: {
          rid: data.rid,
        },
      });
      if (updateComments === 1) {
        if (data.task_type !== "activity") {
          await CaseHistory.create({
            created_by: data.modified_by,
            created_datetime: new Date(),
            case_rid: data.case_rid,
            task_rid: data.task_rid,
            attribute_name: "Comments",
            old_value: "CREATE",
            new_value: "updated a comment",
          });
        }
        const checkIsDifferentCollaborator = await this.isNewCollaborator(
          data.modified_by,
          accountNumber,
          data.task_type || "case_task",
          data.case_rid,
          data.task_rid
        );
        if (!checkIsDifferentCollaborator) {
          const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(
            data.modified_by,
            data.case_rid,
            data.account_rid,
            data.task_rid,
            accountNumber,
            data.task_type
          );
          if (!checkCollaboratorExists) {
            const collaboratorPayload: any = {
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              assigned_to: data.modified_by,
              created_by: data.modified_by,
              created_datetime: new Date(),
            };
            if (data.task_type !== "activity") {
              collaboratorPayload.case_rid = data.case_rid;
            }
            await TaskCollaborators.create(collaboratorPayload);
          }
        }
        if (files.length > 0) {
          for (let f of files) {
            const uploadFile = await uploadToAzureBlob(
              f,
              data.account_rid,
              taskNumber,
              accountRNumber,
              "cases"
            );
            if (uploadFile) {
              const commentsAttachmentPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                account_rid: data.account_rid,
                task_rid: data.task_rid,
                comments_rid: data.rid,
                browse_file: uploadFile.url,
                size: uploadFile.size.toString(),
                format: uploadFile.extension,
                document_name: uploadFile.name,
                is_file_deleted: false,
              };
              const taskAttachmentPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                account_rid: data.account_rid,
                task_rid: data.task_rid,
                browse_file: uploadFile.url,
                size: uploadFile.size.toString(),
                format: uploadFile.extension,
                document_name: uploadFile.name,
                is_file_deleted: false,
                comments_rid: data.rid,
              };
              const caseHistoryPayload: any = {
                created_by: data.modified_by,
                created_datetime: new Date(),
                attribute_name: "comments_attachments",
                old_value: "CREATE",
                new_value: "added an attachment",
                task_rid: data.task_rid,
                account_rid: data.account_rid,
              };
              if (data.task_type !== "activity") {
                commentsAttachmentPayload.case_rid = data.case_rid;
                taskAttachmentPayload.case_rid = data.case_rid;
                caseHistoryPayload.case_rid = data.case_rid;
                await CaseHistory.create(caseHistoryPayload);
              } else {
                caseHistoryPayload.activity_rid = data.task_rid;
                await ActivityHistory.create(caseHistoryPayload);
              }
              await CommentsAttachments.create(commentsAttachmentPayload);
              await TaskAttachments.create(taskAttachmentPayload);
            }
          }
        } else {
          if (data.deleted_file_ids.length > 0) {
            for (let id of data.deleted_file_ids) {
              const fetchCommentsAttachmentDetails =
                await CommentsAttachments.findOne({
                  where: {
                    rid: id,
                  },
                  raw: true,
                });
              if (fetchCommentsAttachmentDetails) {
                await deleteFromAzureBlob(
                  fetchCommentsAttachmentDetails.browse_file
                );
                const [commentsAttachmentRes] =
                  await CommentsAttachments.update(
                    { is_file_deleted: true },
                    { where: { rid: id } }
                  );
                if (commentsAttachmentRes === 1) {
                  await TaskAttachments.update(
                    { is_file_deleted: true },
                    {
                      where: {
                        browse_file: fetchCommentsAttachmentDetails.browse_file,
                        is_file_deleted: false,
                      },
                    }
                  );
                  if (data.task_type !== "activity") {
                    await this.addTaskTimeline(
                      accountNumber,
                      fetchCommentsAttachmentDetails.rid,
                      data.account_rid,
                      `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`,
                      data.modified_by,
                      "Task Comments Attachments deleted",
                      "success",
                      data.task_rid
                    );
                    await CaseHistory.create({
                      created_by: data.modified_by,
                      created_datetime: new Date(),
                      attribute_name: "comments_attachments",
                      old_value: "CREATE",
                      new_value: "deleted an attachment in comment",
                      task_rid: data.task_rid,
                      case_rid: data.case_rid,
                    });
                  } else {
                    const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                      userId: data.modified_by,
                      eventType: eventTypes.UI_HANDLER
                    });
                    const existingTaskInfo: any = await CaseTask.findOne({
                      where: {
                        rid: data.task_rid,
                        account_rid: data.account_rid,
                        case_rid: data.case_rid,
                      },
                      raw: true,
                    });

                    await CaseTimeline.create({
                      created_by: data.modified_by,
                      created_by_name: userEventInfo.full_name,
                      event_type_rid: userEventInfo.event_type_rid,
                      created_datetime: new Date(),
                      account_rid: data.account_rid,
                      entity_rid: data.task_rid,
                      case_rid: data.case_rid,
                      event_name: eventNames.DELETE,
                      entity_name: entityTypes.ATTACHMENT,
                      descriptions: `${fetchCommentsAttachmentDetails.document_name} in comments for task ${existingTaskInfo.task_name}`,
                    });
                  }
                }
              }
            }
          }
        }
        const fetchUpdatedColumns = getColumnsNamesForTaskCommentsUpdate(
          data,
          isCommentExists
        );
        if (fetchUpdatedColumns.length > 0) {
          let updatedColumnsStorage: string[] = [];
          let oldValue: string;
          let newValue: string;
          let columnName: string;
          let combinedColumns: string = ``;
          for (let c of fetchUpdatedColumns) {
            oldValue = (isCommentExists as any)[c];
            newValue = (data as any)[c];
            columnName = c;

            const historyPayload: any = {
              created_by: data.modified_by,
              created_datetime: new Date(),
              attribute_name: columnName,
              old_value: oldValue,
              new_value: newValue,
              task_rid: data.task_rid,
            };
            if (data.task_type !== "activity") {
              historyPayload.case_rid = data.case_rid;
              await CaseHistory.create(historyPayload);
            } else {
              historyPayload.activity_rid = data.task_rid;
              historyPayload.account_rid = data.account_rid;
              await ActivityHistory.create(historyPayload);
            }

            updatedColumnsStorage.push(`${oldValue} changed to ${newValue}`);
          }
          if (updatedColumnsStorage.length > 0) {
            combinedColumns = updatedColumnsStorage.join(", ");
          }
          if (data.task_type !== "activity") {
            const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
              userId: data.modified_by,
              eventType: eventTypes.UI_HANDLER
            });
            const existingTaskInfo: any = await CaseTask.findOne({
              where: {
                rid: data.task_rid,
                account_rid: data.account_rid,
                case_rid: data.case_rid,
              },
              raw: true,
            });
            await CaseTimeline.create({
              created_by: data.modified_by,
              created_by_name: userEventInfo.full_name,
              event_type_rid: userEventInfo.event_type_rid,
              created_datetime: new Date(),
              account_rid: data.account_rid,
              entity_rid: data.case_rid,
              entity_name: entityTypes.COMMENTS,
              event_name: eventNames.UPDATE,
              descriptions: `Task ${existingTaskInfo.task_name}`,
            });
          } else {
            await this.addTaskTimeline(
              accountNumber,
              data.rid,
              data.account_rid,
              `Task Comments Updated : ${combinedColumns}`,
              data.modified_by,
              "Task Comments Updated",
              "success",
              data.task_rid
            );
          }
        }
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.commentsUpdatedSuccess,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: STATUS_MESSAGE.commentsFailedUpdate,
        };
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
        const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
          userId: userId,
          eventType: eventTypes.UI_HANDLER
        });
        await this.helperMethod.createAccountTimelineEntry(accountNumber!, {
          created_by: userId!,
          account_rid: accountRid,
          entity_rid: taskRid,
          entity_name: entityTypes.ACTIVITY_TASK,
          created_by_name: userEventInfo.full_name,
          event_type_rid: userEventInfo.event_type_rid,
          event_name: eventNames.CREATE,
          descriptions: entityresponse.task_name,
          project_rid: attachmentLevel === 'project' ? entityresponse.attach_to : '',
          case_rid: attachmentLevel === 'case' ? entityresponse.attach_to : '',
        }, [attachmentLevel]);
        // if (attachmentLevel === "case") {
        //   /*const { CaseTimeline } = await this.caseModelService.getModels(
        //     accountNumber
        //   );
        //   console.log("Adding case timeline...", entity_rid, accountRid, userId);
        //   await CaseTimeline.create({
        //     account_rid: accountRid,
        //     event_name: eventName,
        //     event_status: eventStatus,
        //     event_type: "ui handler",
        //     entity_rid: entity_rid || "",
        //     description: description,
        //     created_by: userId,
        //     event_datetime: new Date(),
        //     created_datetime: new Date(),
        //   }); */
        //   insertQuery = rawQueries.insertTimeline(schemaName, "case_timeline");
        // } else if (attachmentLevel === "project") {
        //   insertQuery = rawQueries.insertTimeline(
        //     schemaName,
        //     "project_timeline"
        //   );
        // } else if (attachmentLevel === "project_resource") {
        //   insertQuery = rawQueries.insertTimeline(
        //     schemaName,
        //     "project_resource_timeline"
        //   );
        // } else if (attachmentLevel === "project_task") {
        //   insertQuery = rawQueries.insertTimeline(
        //     schemaName,
        //     "project_task_timeline"
        //   );
        // } else if (attachmentLevel === "resource") {
        //   insertQuery = rawQueries.insertTimeline(
        //     schemaName,
        //     "resource_timeline"
        //   );
        // } else {
        //   insertQuery = rawQueries.insertTimeline(
        //     schemaName,
        //     "account_timeline"
        //   );
        // }

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
            created_datetime: new Date(),
          },
        });
      }
    } catch (err) {
      logMessage(`Error creating case team timeline: ${err}`);
    }
  }

  async deleteComments(data: DeleteCommentsType, accountNumber: string) {
    const { TaskComments, CommentsAttachments, TaskAttachments } =
      await this.caseModelService.getModels(accountNumber);
    const isCommentExists = await TaskComments.findOne({
      where: {
        rid: data.rid,
      },
    });
    if (isCommentExists) {
      if (data.deleted_file_ids.length > 0) {
        for (let id of data.deleted_file_ids) {
          const fetchCommentsAttachmentDetails =
            await CommentsAttachments.findOne({
              where: {
                rid: id,
              },
              raw: true,
            });
          if (fetchCommentsAttachmentDetails) {
            await deleteFromAzureBlob(
              fetchCommentsAttachmentDetails.browse_file
            );
            const [deleteCommentsAttachRes] = await CommentsAttachments.update(
              { is_file_deleted: true },
              { where: { rid: id } }
            );
            if (deleteCommentsAttachRes === 1) {
              await TaskAttachments.update(
                { is_file_deleted: true },
                {
                  where: {
                    browse_file: fetchCommentsAttachmentDetails.browse_file,
                    is_file_deleted: false,
                  },
                }
              );
              if (data.task_type !== "activity") {
                const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                  userId: data.modified_by,
                  eventType: eventTypes.UI_HANDLER
                });
                const existingTaskInfo: any = await CaseTask.findOne({
                  where: {
                    rid: data.task_rid,
                    account_rid: data.account_rid,
                    case_rid: data.case_rid,
                  },
                  raw: true,
                });

                await CaseTimeline.create({
                  created_by: data.modified_by,
                  created_datetime: new Date(),
                  created_by_name: userEventInfo.full_name,
                  event_type_rid: userEventInfo.event_type_rid,
                  account_rid: data.account_rid,
                  entity_rid: data.case_rid,
                  event_name: eventNames.DELETE,
                  entity_name: entityTypes.COMMENTS,
                  descriptions: `Task ${existingTaskInfo.task_name}`,
                });
              } else {
                await this.addTaskTimeline(
                  accountNumber,
                  fetchCommentsAttachmentDetails.rid,
                  data.account_rid,
                  `Task Comments : ${fetchCommentsAttachmentDetails.document_name}`,
                  data.modified_by,
                  "Task Comments Attachments deleted",
                  "success",
                  data.task_rid
                );
              }
            }
          }
        }
      } else {
        let whereClause: any = {
          account_rid: data.account_rid,
          task_rid: data.task_rid,
          comments_rid: data.rid,
        };
        if (data.task_type !== "activity") {
          whereClause.case_rid = data.case_rid;
        }
        const fetchCommentsAttachmentDetails =
          await CommentsAttachments.findAll({
            where: whereClause,
            raw: true,
          });
        if (fetchCommentsAttachmentDetails.length > 0) {
          for (let d of fetchCommentsAttachmentDetails) {
            await deleteFromAzureBlob(d.browse_file);
            const [deleteCommentsAttach] = await CommentsAttachments.update(
              { is_file_deleted: true },
              { where: { rid: d.rid } }
            );
            if (deleteCommentsAttach == 1) {
              await TaskAttachments.update(
                { is_file_deleted: true },
                {
                  where: {
                    browse_file: d.browse_file,
                    is_file_deleted: false,
                  },
                }
              );
              if (data.task_type !== "activity") {
                const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                  userId: data.modified_by,
                  eventType: eventTypes.UI_HANDLER
                });
                // await CaseTimeline.create({
                //   created_by: data.modified_by,
                //   created_by_name: userEventInfo.full_name,
                //   event_type_rid: userEventInfo.event_type_rid,
                //   created_datetime: new Date(),
                //   account_rid: data.account_rid,
                //   entity_rid: data.case_rid,
                //   event_name: "Task Comments Attachments deleted",
                //   event_type: "ui handler",
                //   event_status: "success",
                //   event_datetime: new Date(),
                //   description: `Task Comments : ${d.document_name}`,
                // });
              } else {
                await this.addTaskTimeline(
                  accountNumber,
                  d.rid,
                  data.account_rid,
                  `Task Comments : ${d.document_name}`,
                  data.modified_by,
                  "Task Comments Attachments deleted",
                  "success",
                  data.task_rid
                );
              }
            }
          }
        }
        if (data.task_type !== "activity") {
          const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
            userId: data.modified_by,
            eventType: eventTypes.UI_HANDLER
          });
          // await CaseTimeline.create({
          //   created_by: data.modified_by,
          //   created_by_name: userEventInfo.full_name,
          //   event_type_rid: userEventInfo.event_type_rid,
          //   created_datetime: new Date(),
          //   account_rid: data.account_rid,
          //   entity_rid: data.case_rid,
          //   event_name: "Task Comment Deleted",
          //   event_type: "ui handler",
          //   event_status: "success",
          //   event_datetime: new Date(),
          //   description: `Task Comments Deleted : ${isCommentExists.comments}`,
          // });
        } else {
          await this.addTaskTimeline(
            accountNumber,
            data.rid,
            data.account_rid,
            `Task Comments Deleted : ${isCommentExists.comments}`,
            data.modified_by,
            "Task Comments  deleted",
            "success",
            data.task_rid
          );
        }
        const deleteComments = await TaskComments.destroy({
          where: { rid: data.rid },
        });
        if (deleteComments === 1) {
          const checkIsDifferentCollaborator = await this.isNewCollaborator(
            data.modified_by,
            accountNumber,
            data.task_type || "case_task",
            data.case_rid,
            data.task_rid
          );
          if (!checkIsDifferentCollaborator) {
            const checkCollaboratorExists =
              await this.isCollaboratorAlreadyAdded(
                data.modified_by,
                data.case_rid,
                data.account_rid,
                data.task_rid,
                accountNumber,
                data.task_type
              );
            if (!checkCollaboratorExists) {
              const collaboratorPayload: any = {
                account_rid: data.account_rid,
                task_rid: data.task_rid,
                assigned_to: data.modified_by,
                created_by: data.modified_by,
                created_datetime: new Date(),
              };
              if (data.task_type !== "activity") {
                collaboratorPayload.case_rid = data.case_rid;
              }
              await TaskCollaborators.create(collaboratorPayload);
            }
          }
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.commentsDeletedSuccess,
          };
        } else {
          return {
            statusCode: HttpStatus.FAILED,
            statusMessage: STATUS_MESSAGE.commentsFaileDDelete,
          };
        }
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.dataNotAvailable,
      };
    }
  }

  async addAttachmentForTask(
    data: any,
    accountNumber: string,
    files: Express.Multer.File[],
    userId: string,
    accountRNumber: string
  ) {
    const { TaskAttachments, ActivityHistory } =
      await this.caseModelService.getModels(accountNumber);
    const findTaskDetails = await this.findTaskById(
      data.task_rid,
      data.account_rid,
      data.case_rid,
      accountNumber,
      data.task_type || "case_task"
    );
    if (files != undefined) {
      if (Array.isArray(files)) {
        for (let f of files) {
          const uploadFile = await uploadToAzureBlob(
            f,
            data.account_rid,
            findTaskDetails?.r_number!,
            accountRNumber,
            "cases"
          );
          if (uploadFile) {
            const taskAttachmentPayload: any = {
              account_rid: data.account_rid,
              task_rid: data.task_rid,
              browse_file: uploadFile.url,
              document_name: uploadFile.name,
              size: uploadFile.size.toString(),
              format: uploadFile.extension,
              is_file_deleted: false,
              created_by: userId,
              created_datetime: new Date(),
            };
            if (data.task_type !== "activity") {
              taskAttachmentPayload.case_rid = data.case_rid;
            }
            // Only add case_rid if not activity
            const result = await TaskAttachments.create(taskAttachmentPayload);
            if (data.task_type !== "activity") {
              const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                userId: data.modified_by,
                eventType: eventTypes.UI_HANDLER
              });
              const existingTaskInfo: any = await CaseTask.findOne({
                where: {
                  rid: data.task_rid,
                  account_rid: data.account_rid,
                  case_rid: data.case_rid,
                },
                raw: true,
              });
              await CaseTimeline.create({
                created_by: userId,
                created_datetime: new Date(),
                created_by_name: userEventInfo.full_name,
                event_type_rid: userEventInfo.event_type_rid,
                account_rid: data.account_rid,
                entity_rid: data.case_rid,
                event_name: eventNames.ADDED,
                entity_name: entityTypes.ATTACHMENT,
                descriptions: `Task ${existingTaskInfo.task_name}`,
              });
              await CaseHistory.create({
                created_by: userId,
                created_datetime: new Date(),
                case_rid: data.case_rid,
                attribute_name: "task_attachments",
                old_value: "CREATE",
                new_value: "added an attachment",
                task_rid: data.task_rid,
              });
            } else {
              await this.addTaskTimeline(
                accountNumber,
                result.dataValues.rid,
                data.account_rid,
                `Task Attachments Added : ${uploadFile.url}`,
                userId,
                `Attachment added for task ${findTaskDetails?.task_name}`,
                "success",
                data.task_rid
              );
              await ActivityHistory.create({
                created_by: userId,
                created_datetime: new Date(),
                attribute_name: "task_attachments",
                old_value: "CREATE",
                new_value: "added an attachment",
                activity_rid: data.task_rid,
                account_rid: data.account_rid
              });
            }
          }
        }
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.attachmentUploadedSuccess,
        };
      }
    }
    return {
      statusCode: HttpStatus.FAILED,
      statusMessage: STATUS_MESSAGE.fileNotFound,
    };
  }

  async deleteAttachment(accountNumber: string, data: any, userId: string) {
    const { TaskAttachments, ActivityHistory } = await this.caseModelService.getModels(
      accountNumber
    );
    const findTaskDetails = await this.findTaskById(
      data.task_rid,
      data.account_rid,
      data.case_rid,
      accountNumber,
      data.task_type || "case_task"
    );
    const checkIsFileExists = await TaskAttachments.findOne({
      where: {
        rid: data.rid,
        is_file_deleted: false,
      },
    });
    if (checkIsFileExists) {
      await deleteFromAzureBlob(data.url);
      const [updateFile] = await TaskAttachments.update(
        {
          is_file_deleted: true,
          modified_by: userId,
          modified_datetime: new Date(),
        },
        { where: { rid: data.rid } }
      );
      if (updateFile === 1) {
        if (data.task_type !== "activity") {
          const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
            userId: data.modified_by,
            eventType: eventTypes.UI_HANDLER
          });
          await CaseTimeline.create({
            created_by: userId,
            created_datetime: new Date(),
            created_by_name: userEventInfo.full_name,
            event_type_rid: userEventInfo.event_type_rid,
            account_rid: data.account_rid,
            entity_rid: data.case_rid,
            event_name: eventNames.DELETE,
            entity_name: entityTypes.ATTACHMENT,
            descriptions: `Task ${findTaskDetails?.task_name}`,
          });
          await CaseHistory.create({
            created_by: userId,
            created_datetime: new Date(),
            case_rid: data.case_rid,
            attribute_name: "task_attachments",
            old_value: "CREATE",
            new_value: "deleted an attachment",
            task_rid: data.task_rid,
          });
        } else {
          await ActivityHistory.create({
            created_by: userId,
            created_datetime: new Date(),
            attribute_name: "task_attachments",
            old_value: "CREATE",
            new_value: "deleted an attachment",
            activity_rid: data.task_rid,
            account_rid: data.account_rid
          });
          await this.addTaskTimeline(
            accountNumber,
            checkIsFileExists.rid,
            data.account_rid,
            `Task Attachments Deleted : ${checkIsFileExists.document_name}`,
            userId,
            `Attachment deleted for task ${findTaskDetails?.task_name}`,
            "success",
            data.task_rid
          );
        }

        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.attachmentDeletedSuccess,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: STATUS_MESSAGE.attachmentDeleteFailed,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: STATUS_MESSAGE.attachmentNotFound,
      };
    }
  }

  async listTaskLevelAttachments(accountNumber: string, data: any) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    let offset = (data.page - 1) * data.limit;
    const { TaskAttachments } = await this.caseModelService.getModels(
      accountNumber
    );
    let whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.task_rid,
      is_file_deleted: false,
    };
    if (data.task_type !== "activity") {
      whereClause.case_rid = data.case_rid;
    }
    let fetchAllTaskAttachments = await TaskAttachments.findAll({
      where: whereClause,
      raw: true,
    });
    if (fetchAllTaskAttachments.length > 0) {
      const total = fetchAllTaskAttachments.length;
      fetchAllTaskAttachments = fetchAllTaskAttachments.slice(
        offset,
        data.page * data.limit
      );
      const userIds = [
        ...new Set(fetchAllTaskAttachments.map((d: any) => d.created_by)),
      ];
      const findUsers = await this.mainDbSequelize.query(
        rawQueries.getOwnerDetails(userIds)
      );
      const userMap = new Map(findUsers[0].map((d: any) => [d.rid, d.name]));
      const structuredDate = await Promise.all(
        fetchAllTaskAttachments.map(async (d: any) => {
          return {
            ...d,
            created_by_name: userMap.get(d.created_by) || null,
            browse_file: await generateSasUrl(d.browse_file),
          };
        })
      );
      const finalData = {
        page: data.page,
        limit: data.limit,
        total_result: total,
        data: structuredDate,
      };
      return {
        statusCode: HttpStatus.SUCCESS,
        statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
        data: finalData,
      };
    } else {
      const finalData = {
        page: data.page,
        limit: data.limit,
        total_result: 0,
        data: [],
      };
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusCodeValue: HttpStatus.NOT_FOUND_MESSAGE,
        data: finalData,
      };
    }
  }
  async addCollaborators(data: any, accountNumber: string) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { TaskCollaborators, CaseHistory } =
      await this.caseModelService.getModels(accountNumber);
    const checkIsDifferentCollaborator = await this.isNewCollaborator(
      data.user_rid,
      accountNumber,
      data.task_type,
      data.case_rid,
      data.rid
    );
    if (!checkIsDifferentCollaborator) {
      const checkCollaboratorExists = await this.isCollaboratorAlreadyAdded(
        data.user_rid,
        data.case_rid,
        data.account_rid,
        data.rid,
        accountNumber,
        data.task_type
      );
      if (!checkCollaboratorExists) {
        const collaboratorPayload: any = {
          account_rid: data.account_rid,
          task_rid: data.rid,
          assigned_to: data.user_rid,
          created_by: data.created_by,
          created_datetime: new Date(),
        };
        if (data.task_type !== "activity") {
          collaboratorPayload.case_rid = data.case_rid;
          const findUser: any = await this.mainDbSequelize.query(
            rawQueries.getUserById(data.user_rid)
          );
          await CaseHistory.create({
            created_by: data.created_by,
            created_datetime: new Date(),
            attribute_name: "Collaborator",
            old_value: `CREATE`,
            new_value: `added a collaborator ${findUser[0][0].name}`,
            case_rid: data.case_rid,
            task_rid: data.rid,
          });
        }
        const result = await TaskCollaborators.create(collaboratorPayload);
        if (result) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusMessage: STATUS_MESSAGE.collaboratorsAddedSuccesss,
          };
        } else {
          return {
            statusCode: HttpStatus.FAILED,
            statusMessage: STATUS_MESSAGE.collaboratorAddedFailed,
          };
        }
      } else {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMessage: STATUS_MESSAGE.collaboratorAlreadyAdded,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.collaboratorAlreadyAdded,
      };
    }
  }
  async fetchCollaboratorsList(accountNumber: string, data: any) {
    const { TaskCollaborators } = await this.caseModelService.getModels(
      accountNumber
    );
    let whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.rid,
    };
    if (data.task_type !== "activity") {
      whereClause.case_rid = data.case_rid;
    }
    const result = await TaskCollaborators.findAll({
      attributes: ["assigned_to"],
      where: whereClause,
      raw: true,
    });
    if (result.length > 0) return result;
    else return [];
  }
  async taskWorkflowConnector(
    accountNumber: string,
    data: CaseTaskWorkFlowCreate,
    transaction: Transaction
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    const {
      CaseTaskWorkflowConnector,
      CaseTask,
      CaseTimeline,
      CaseHistory,
      WorkflowConnector,
    } = await this.caseModelService.getModels(accountNumber);
    let taskIds: string[] = [];
    let iterationCount: number = 0;
    let totalIteration = data.target_rid.length;
    const workFlowConnectorData = await WorkflowConnector.findOne({
      where: {
        rid: data.relationship_connector_rid,
      },
      raw: true,
    });
    const findExistingData = await CaseTaskWorkflowConnector.findAll({
      attributes: ["relationship_connector_rid", "source_rid", "target_rid"],
      where: {
        case_rid: data.case_rid,
        source_rid: data.source_rid,
        target_rid: {
          [Op.in]: data.target_rid.map((d: any) => d),
        },
      },
      raw: true,
    });
    if (findExistingData.length > 0) {
      for (let d of findExistingData) {
        if (d.relationship_connector_rid !== data.relationship_connector_rid) {
          await CaseTaskWorkflowConnector.destroy({
            where: {
              case_rid: data.case_rid,
              source_rid: d.target_rid,
              target_rid: d.source_rid,
            },
          });
          await CaseTaskWorkflowConnector.destroy({
            where: {
              case_rid: data.case_rid,
              source_rid: d.source_rid,
              target_rid: d.target_rid,
            },
          });
        }
      }
    }
    let workFlowConnectorDetails;
    let dynamicRelationTypeName: string = ``;
    if (workFlowConnectorData) {
      if (workFlowConnectorData.relationship_type === "Blocks") {
        dynamicRelationTypeName = relationshipTypes.isBlockedBy;
      } else if (workFlowConnectorData.relationship_type === "Enables") {
        dynamicRelationTypeName = relationshipTypes.isEnabledBy;
      } else if (workFlowConnectorData.relationship_type === "Is Enabled By") {
        dynamicRelationTypeName = relationshipTypes.enables;
      } else if (workFlowConnectorData.relationship_type === "Is Blocked By") {
        dynamicRelationTypeName = relationshipTypes.blocks;
      }
    }
    workFlowConnectorDetails = await WorkflowConnector.findOne({
      where: { relationship_type: dynamicRelationTypeName },
      raw: true,
    });
    for (let d of data.target_rid) {
      iterationCount += 1;
      if (workFlowConnectorData) {
        const checkIsAlreadyMapped = await CaseTaskWorkflowConnector.findOne({
          where: {
            case_rid: data.case_rid,
            account_rid: data.account_rid,
            source_rid: data.source_rid,
            target_rid: d,
            relationship_connector_rid: data.relationship_connector_rid,
          },
          raw: true,
        });
        if (!checkIsAlreadyMapped) {
          const ids: any[] = [];
          ids.push(data.relationship_connector_rid);
          ids.push(workFlowConnectorDetails!.rid);
          const result = await CaseTaskWorkflowConnector.create(
            {
              created_by: data.created_by,
              created_datetime: new Date(),
              case_rid: data.case_rid,
              account_rid: data.account_rid,
              source_rid: data.source_rid,
              target_rid: d,
              relationship_connector_rid: data.relationship_connector_rid,
            },
            { transaction }
          );
          if (result) {
            if (workFlowConnectorDetails) {
              const checkForMapping = await CaseTaskWorkflowConnector.findOne({
                where: {
                  case_rid: data.case_rid,
                  account_rid: data.account_rid,
                  source_rid: d,
                  target_rid: data.source_rid,
                  relationship_connector_rid: workFlowConnectorDetails.rid!,
                },
                raw: true,
              });
              if (!checkForMapping) {
                await CaseTaskWorkflowConnector.create(
                  {
                    created_by: data.created_by,
                    created_datetime: new Date(),
                    case_rid: data.case_rid,
                    account_rid: data.account_rid,
                    source_rid: d,
                    target_rid: data.source_rid,
                    relationship_connector_rid: workFlowConnectorDetails.rid!,
                  },
                  { transaction }
                );
              }
            }
          }
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.taskNotFound,
        };
      }
    }
    if (iterationCount === totalIteration) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.workflowConnectorMappedSuccess,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.workflowConnectorMappedFailed,
      };
    }
  }

  async deleteTaskWorkConnector(
    accountNumber: string,
    data: CaseTaskWorkFlowCreate
  ) {
    const {
      CaseTaskWorkflowConnector,
      CaseTimeline,
      WorkflowConnector,
      CaseTask,
    } = await this.caseModelService.getModels(accountNumber);
    if (data.delete_target_rids.length > 0) {
      let workFlowConnectorDetails;
      let deletedId: string;
      let dynamicRelationTypeName: string = ``;
      const workFlowConnectorData = await WorkflowConnector.findOne({
        where: {
          rid: data.relationship_connector_rid,
        },
        raw: true,
      });
      if (workFlowConnectorData) {
        if (workFlowConnectorData.relationship_type === "Blocks") {
          dynamicRelationTypeName = relationshipTypes.isBlockedBy;
        } else if (workFlowConnectorData.relationship_type === "Enables") {
          dynamicRelationTypeName = relationshipTypes.isEnabledBy;
        } else if (
          workFlowConnectorData.relationship_type === "Is Enabled By"
        ) {
          dynamicRelationTypeName = relationshipTypes.enables;
        } else if (
          workFlowConnectorData.relationship_type === "Is Blocked By"
        ) {
          dynamicRelationTypeName = relationshipTypes.blocks;
        }
      }
      workFlowConnectorDetails = await WorkflowConnector.findOne({
        where: {
          relationship_type: dynamicRelationTypeName,
        },
        raw: true,
      });
      const taskNames = await CaseTask.findAll({
        attributes: ["task_name"],
        where: {
          rid: {
            [Op.in]: data.delete_target_rids.map((d: any) => d),
          },
          case_rid: data.case_rid,
        },
        raw: true,
      });
      let dynamicTask;
      if (taskNames.length === 1) dynamicTask = "task";
      else if (taskNames.length > 1) dynamicTask = "tasks";
      for (let d of data.delete_target_rids) {
        const checkDataExists = await CaseTaskWorkflowConnector.findOne({
          where: {
            source_rid: data.source_rid,
            target_rid: d,
            account_rid: data.account_rid,
            case_rid: data.case_rid,
            relationship_connector_rid: data.relationship_connector_rid,
          },
          raw: true,
        });
        if (checkDataExists) {
          deletedId = checkDataExists.rid!;
          if (workFlowConnectorDetails) {
            const deleteData = await CaseTaskWorkflowConnector.destroy({
              where: {
                case_rid: data.case_rid,
                account_rid: data.account_rid,
                source_rid: checkDataExists.target_rid,
                target_rid: checkDataExists.source_rid,
                relationship_connector_rid: workFlowConnectorDetails.rid,
              },
            });
            if (deleteData === 1) {
              await CaseTaskWorkflowConnector.destroy({
                where: {
                  source_rid: data.source_rid,
                  target_rid: d,
                  account_rid: data.account_rid,
                  case_rid: data.case_rid,
                  relationship_connector_rid: data.relationship_connector_rid,
                },
              });
              const userEventInfo: any = await this.helperMethod.fetchUserAndEventInfo({
                userId: data.created_by,
                eventType: eventTypes.UI_HANDLER
              });
              // await CaseTimeline.create({
              //   created_by: data.created_by,
              //   created_datetime: new Date(),
              //   account_rid: data.account_rid,
              //   entity_rid: data.case_rid,
              //   event_name: `Case Task Workflow Connector deleted`,
              //   event_type: "ui handler",
              //   event_status: "success",
              //   event_datetime: new Date(),
              //   description: ``,
              //   created_by_name: userEventInfo.full_name,
              //   event_type_rid: userEventInfo.event_type_rid,
              // });
            } else {
              return {
                statusCode: HttpStatus.FAILED,
                statusMessage:
                  STATUS_MESSAGE.workflowConnectorMappedDeletedFailed,
              };
            }
          }
        } else {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            statusMessage: STATUS_MESSAGE.dataNotAvailable,
          };
        }
      }
      if (taskNames.length > 0) {
        await CaseHistory.create({
          created_by: data.created_by,
          created_datetime: new Date(),
          case_rid: data.case_rid,
          attribute_name: "Linked Items",
          old_value: "CREATE",
          new_value: `deleted the linked ${dynamicTask} ${taskNames
            .map((d: any) => d.task_name)
            .join(",")}`,
          task_rid: data.source_rid,
        });
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.workflowConnectorMappedDeleted,
        };
      }
    }
  }
  async listTasksDropdownForAccountLevel(accountNumber: string, data: any) {
    const { CaseTask } = await this.caseModelService.getModels(accountNumber);
    const result = await CaseTask.findAll({
      attributes: ["rid", "task_name"],
      where: {
        account_rid: data.account_rid,
        case_rid: data.case_rid,
        task_name: {
          [Op.iLike]: data.search == "" ? "%%" : `%${data.search}%`,
        },
      },
      raw: true,
      order: [["task_name", "ASC"]],
    });
    return result;
  }
  async fetchMappedTags(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    taskRid: string
  ) {
    const { TaskTag } = await this.caseModelService.getModels(accountNumber);
    const result = await TaskTag.findAll({
      where: {
        account_rid: accountRid,
        case_rid: caseRid,
        task_rid: taskRid,
      },
      raw: true,
    });
    return result;
  }

  async deleteTags(
    accountNumber: string,
    caseRid: string,
    accountRid: string,
    taskRid: string,
    tagRid: string[],
    userId: string,
    task_type: string
  ) {
    const { TaskTag, Tags, ActivityHistory } =
      await this.caseModelService.getModels(accountNumber);
    let responseMessage: string;
    let dynamicTagName: string;
    if (tagRid.length == 1) {
      responseMessage = STATUS_MESSAGE.tagDeletedSuccess;
      dynamicTagName = "Tag";
    } else {
      responseMessage = STATUS_MESSAGE.multipleTagDeletedSuccess;
      dynamicTagName = "Tags";
    }
    if (tagRid.length == 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: STATUS_MESSAGE.tagRequired,
      };
    }
    const findTagName = await Tags.findAll({
      attributes: ["tag_name"],
      where: {
        rid: {
          [Op.in]: tagRid.map((d: any) => d),
        },
      },
      raw: true,
    });
    let whereClause: any = {
      account_rid: accountRid,
      task_rid: taskRid,
      tag_rid: {
        [Op.in]: tagRid.map((d: any) => d),
      },
    };
    if (task_type !== "activity") {
      whereClause.case_rid = caseRid;
    }
    const result = await TaskTag.destroy({
      where: whereClause,
    });
    if (result > 0) {
      if (findTagName.length > 0) {
        if (task_type !== "activity") {
          await CaseHistory.create({
            created_by: userId,
            created_datetime: new Date(),
            attribute_name: "Tags",
            old_value: `CREATE`,
            new_value: `deleted the following ${dynamicTagName} ${findTagName
              .map((d: any) => d.tag_name)
              .join(" , ")}`,
            case_rid: caseRid,
            task_rid: taskRid,
          });
        } else {
          await ActivityHistory.create({
            created_by: userId,
            account_rid: accountRid,
            created_datetime: new Date(),
            attribute_name: "Tags",
            old_value: `CREATE`,
            new_value: `deleted the following ${dynamicTagName} ${findTagName
              .map((d: any) => d.tag_name)
              .join(" , ")}`,
            activity_rid: taskRid,
          });
        }
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: responseMessage,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.tagDeletionFailed,
      };
    }
  }
  async deleteCollaborators(accountNumber: string, data: any) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { TaskCollaborators } = await this.caseModelService.getModels(
      accountNumber
    );
    const whereClause: any = {
      account_rid: data.account_rid,
      task_rid: data.rid,
      assigned_to: data.assigned_to,
    };
    if (data.task_type !== "activity") {
      whereClause.case_rid = data.case_rid;
      const findUser: any = await this.mainDbSequelize.query(
        rawQueries.getUserById(data.user_rid)
      );
      await CaseHistory.create({
        created_by: data.user_rid,
        created_datetime: new Date(),
        attribute_name: "Collaborator",
        old_value: `CREATE`,
        new_value: `deleted a collaborator ${findUser[0][0].name}`,
        case_rid: data.case_rid,
        task_rid: data.rid,
      });
    }
    const result = await TaskCollaborators.destroy({
      where: whereClause,
    });
    if (result > 0) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.collaboratorsRemovedSuccesss,
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.collaboratorRemovedFailed,
      };
    }
  }
  async checkTaskWorkFlow(
    accountNumber: string,
    taskRid: string,
    statusRid: string,
    caseRid: string,
    targetRids: any
  ) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { CaseTaskWorkflowConnector } = await this.caseModelService.getModels(
      accountNumber
    );
    const findTaskDependency = await CaseTaskWorkflowConnector.findAll({
      where: {
        source_rid: taskRid,
        target_rid: {
          [Op.in]: targetRids,
        },
        case_rid: caseRid,
      },
      raw: true,
    });
    if (findTaskDependency.length > 0) {
      const result = await this.sourceTaskValidation(
        accountNumber,
        findTaskDependency,
        taskRid,
        statusRid,
        caseRid
      );
      if (result !== undefined) {
        if (result.success) {
          return {
            success: true,
            statusMessage: result.statusMessage,
          };
        }
      } else {
        return {
          success: false,
          statusMessage: null,
        };
      }
    }
  }

  private async sourceTaskValidation(
    accountNumber: string,
    findTaskDependency: CaseTaskWorkflowConnector[],
    sourceRid: string,
    statusRid: string,
    caseRid: string
  ) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { WorkflowConnector, CaseTask } =
      await this.caseModelService.getModels(accountNumber);
    const relationIds = [
      ...new Set(
        findTaskDependency.map(
          (d: CaseTaskWorkflowConnector) => d.relationship_connector_rid
        )
      ),
    ];
    const findRelationshipConnector = await WorkflowConnector.findAll({
      where: {
        rid: {
          [Op.in]: relationIds,
        },
      },
      raw: true,
    });
    if (findRelationshipConnector.length > 0) {
      const mapRelationShip: Map<string, string> = new Map(
        findRelationshipConnector.map((d: any) => [d.rid, d.relationship_type])
      );
      const targetIds = [
        ...new Set(
          findTaskDependency.map((d: CaseTaskWorkflowConnector) => d.target_rid)
        ),
      ];
      targetIds.push(sourceRid);
      const findCaseTasks = await CaseTask.findAll({
        where: {
          rid: {
            [Op.in]: targetIds,
          },
          case_rid: caseRid,
        },
        raw: true,
      });
      if (findCaseTasks.length > 0) {
        const mapTargetTasks: Map<string, CaseTask> = new Map(
          findCaseTasks.map((d: any) => [d.rid, d])
        );

        const taskStatusIds = [
          ...new Set(findCaseTasks.map((d: any) => d.task_status_rid)),
        ];
        taskStatusIds.push(statusRid);
        let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
        if (fetchStatusQuery) {
          const findTaskStatus: any = await this.mainDbSequelize.query(
            fetchStatusQuery
          );
          const taskStatusMap = new Map(
            findTaskStatus[0].map((d: any) => [d.rid, d.task_status_name])
          );

          for (let f of findTaskDependency) {
            if (
              mapRelationShip.get(f.relationship_connector_rid) ===
              "Is Enabled By"
            ) {
              if (
                taskStatusMap.get(
                  mapTargetTasks.get(f.target_rid)?.task_status_rid
                ) !== "Completed"
              ) {
                if (taskStatusMap.get(statusRid) === "Completed") {
                  return {
                    success: true,
                    statusCode: HttpStatus.BAD_REQUEST,
                    statusMessage: `This task cannot be completed because it is enabled by ${mapTargetTasks.get(f.target_rid)?.task_name
                      }`,
                  };
                }
              }
            } else if (
              mapRelationShip.get(f.relationship_connector_rid) ===
              "Is Blocked By"
            ) {
              if (
                taskStatusMap.get(
                  mapTargetTasks.get(f.target_rid)?.task_status_rid
                ) !== "Completed"
              ) {
                return {
                  success: true,
                  statusCode: HttpStatus.BAD_REQUEST,
                  statusMessage: `This task is blocked by ${mapTargetTasks.get(f.target_rid)?.task_name
                    }. Please complete that task before proceeding.`,
                };
              }
            } else {
              return {
                success: false,
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: null,
              };
            }
          }
        }
      }
    }
  }


}
