import { CaseTaskSchemaService } from "./caseTaskSchemaService";
import { Op, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../../config/mainDataSource";
import { initOrgSequelize } from "../../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../../caseModelsService";
import CaseSchemaService from "../schemaService";
import {
  AccountType,
  ActivityType,
  AddCommentsType,
  assignProjectType,
  CaseOwnerType,
  CaseStatusType,
  CaseTaskDropdownType,
  caseTaskStatusTypes,
  CaseTaskWorkFlowCreate,
  CaseTaskWorkFlowDelete,
  ChecklistItems,
  checklistType,
  CommentsListType,
  CountryType,
  CreateCaseTaskType,
  CurrencyType,
  DeleteCommentsType,
  FilingType,
  ICreateCases,
  ICreateCaseTeam,
  ICreateChecklist,
  priorityTypes,
  ProjectFiscalType,
  TagsTypes,
  TaskCardDetailsType,
  TaskCardResponse,
  taskTags,
  TaskTypeResponse,
  taskWorkFlowConnector,
  UpdateCaseTaskType,
  UpdateCommentsType,
} from "../../../utils/types";
import {
  generateExcelBase64,
  generateExcelBase64WithEmptyCheck,
  generateSasUrl,
  isValidTimezone,
  logMessage,
} from "../../../utils/helpers";
import {
  caseStatuses,
  HttpStatus,
  STATUS_MESSAGE,
  rawQueries,
  MAIN_SCHEMA_NAME,
  SCHEMANAME_PREFIX,
  emailCategorties,
  mainTableFiltersForCase,
} from "../../../utils/constants";
import currency from "currency.js";
import moment from "moment";
import { CaseManagementSchemaService } from "../../casesManagement/schemaService";
import {
  fetchCaseProjects,
  fetchTaskActivities,
  fetchTaskComments,
  listAllTaskStatus,
  signoffProjectTechSummary,
  taskCardDetails,
  taskCardDetailsActivityTask,
  updateCaseAggregatedValue,
} from "../../../utils/rawQueries";
import { sendEmailWithAttachment } from "../../emailService";
import ActivitySchemaService from "../../activities/schemaService";
import {
  caseTaskMapping,
  reviewProjectsFieldMappings,
} from "../../../utils/excelExportMapping";
import { HelperMethods } from "../helperMethods";
import { ChecklistSchemaService } from "../caseChecklist/checklistSchemaService";

export class CaseTaskService {
  private caseSchemaService: CaseSchemaService;
  private activitySchemaService: ActivitySchemaService; // Assuming this is defined somewhere in your code
  private caseModelService: CaseModelService; // Assuming this is defined somewhere in your code
  private caseManagementService: CaseManagementSchemaService;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private helperMethod: HelperMethods;
  private caseTaskSchemaService: CaseTaskSchemaService;
  private checklistSchemaService: ChecklistSchemaService;

  constructor() {
    this.caseSchemaService = new CaseSchemaService();
    this.activitySchemaService = new ActivitySchemaService();
    this.caseModelService = new CaseModelService(); // Initialize your model service here
    this.caseManagementService = new CaseManagementSchemaService();
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
    this.caseTaskSchemaService = new CaseTaskSchemaService();
    this.checklistSchemaService = new ChecklistSchemaService();
  }

  protected async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  protected async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }
  async createUserLevelTask(data: CreateCaseTaskType) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const fetchParentNumber: any = await mainDb.query(
        await rawQueries.fetchParentAccount(data.account_rid, mainDb)
      );
      if (fetchParentNumber[0].length > 0) {
        const getTaskType: any = await mainDb.query(
          rawQueries.getTaskTypeMilestone()
        );
        data.task_type_rid = getTaskType[0][0].rid;
        const isTaskNameExists =
          await this.caseTaskSchemaService.checkTaskExistsForUserLevelTask(
            data,
            data.task_type_rid,
            fetchParentNumber[0][0].r_number
          );
        if (isTaskNameExists) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.taskNameExistsAlready,
            data: null,
          };
        } else {
          const isCaseExists =
            await this.caseSchemaService.isCaseExistsForAccount(
              data.account_rid,
              data.case_rid,
              fetchParentNumber[0][0].r_number
            );
          if (isCaseExists) {
            const [getTaskStatus] = await mainDb.query<TaskTypeResponse>(
              rawQueries.getSpecificTaskStatus(),
              { type: QueryTypes.SELECT }
            );
            data.task_status_rid = getTaskStatus?.rid! || "";
            const getActiveStatusId: any = await mainDb.query(
              rawQueries.getActiveStatusId()
            );
            const findUserRoleId =
              await this.caseSchemaService.fetchAssignedToRole(
                data.assigned_to,
                data.case_rid,
                data.account_rid,
                fetchParentNumber[0][0].r_number
              );
            data.case_team_member_role_rid = findUserRoleId?.role_rid!;
            const result = await this.caseTaskSchemaService.createUserLevelTask(
              data,
              fetchParentNumber[0][0].r_number,
              transaction,
              getActiveStatusId[0][0].rid,
              isCaseExists.fiscal_year
            );
            if (result.statusCode === HttpStatus.SUCCESS) {
              await transaction.commit();
              return {
                statusCode: HttpStatus.SUCCESS,
                statusMessage: STATUS_MESSAGE.userLevelTaskCreatedSuccess,
                data: result.data,
              };
            } else if (result.statusCode === HttpStatus.BAD_REQUEST) {
              await transaction.rollback();
              return {
                statusCode: HttpStatus.BAD_REQUEST,
                statusMessage: result.statusMessage,
                data: null,
              };
            } else {
              await transaction.rollback();
              return {
                statusCode: HttpStatus.FAILED,
                statusMessage: STATUS_MESSAGE.taskCreateFailed,
                data: null,
              };
            }
          } else {
            return {
              statusCode: HttpStatus.NOT_FOUND,
              statusMessage: STATUS_MESSAGE.dataNotAvailable,
              data: null,
            };
          }
        }
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          statusMessage: STATUS_MESSAGE.accountNotFound,
          data: null,
        };
      }
    } catch (error) {
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.taskCreateFailed,
        data: null,
      };
    }
  }
  async updateUserLevelTask(data: UpdateCaseTaskType, accessToken : string) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const fetchParentNumber: any = await mainDb.query(
        await rawQueries.fetchParentAccount(data.account_rid, mainDb)
      );
      if (fetchParentNumber[0].length > 0) {
        const findTask: any = await this.caseTaskSchemaService.findTaskById(
          data.rid,
          data.account_rid,
          data.case_rid,
          fetchParentNumber[0][0].r_number,
          "milestone"
        );
        let eid;
        if (findTask) eid = findTask.eid;
        else eid = null;

        const isTaskNameExists =
          await this.caseTaskSchemaService.checkTaskNameExistsForUpdate(
            data,
            fetchParentNumber[0][0].r_number,
            eid
          );
        if (isTaskNameExists) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusMessage: STATUS_MESSAGE.taskNameExistsAlready,
          };
        } else {
          const getActiveStatusId: any = await mainDb.query(
            rawQueries.getActiveStatusId()
          );
          const result = await this.caseTaskSchemaService.updateUserLevelTask(
            data,
            fetchParentNumber[0][0].r_number,
            transaction,
            getActiveStatusId[0][0].rid,
            accessToken
          );
          if (result.statusCode === HttpStatus.SUCCESS) {
            await transaction.commit();
          } else {
            await transaction.rollback();
          }
          return {
            statusCode: result.statusCode,
            statusMessage: result.statusMessage,
          };
        }
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: STATUS_MESSAGE.accountNotFound,
        };
      }
    } catch (error) {
      await transaction.rollback();
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.taskUpdatedFailed,
      };
    }
  }
  async getCheckListForTask(accountNumber: string, caseRid: string) {
    try {
      const checklistDetails =
        await this.checklistSchemaService.fetchCheckListForTask(
          accountNumber,
          caseRid
        );
      return {
        checklist_name: checklistDetails.checklistData?.checklist_name,
        checklist_items: checklistDetails.checklistItems,
      };
    } catch (err) {
      logMessage(`Error fetching checklist for task, ${err}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: STATUS_MESSAGE.checkListError,
      };
    }
  }

  async taskListForCases(data: any, isExport: boolean) {
    const mainDb = await this.getMainDb();

    let fetchParentRnumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(
      fetchParentRnumber[0][0].r_number
    );
    let doSorting: boolean;
    let disablePagination: boolean;
    if (
      data.sort === "assigned_to_name" ||
      data.sort === "task_status_name" ||
      data.sort === "role_name"
    ) {
      doSorting = false;
      disablePagination = true;
    } else {
      doSorting = true;
      disablePagination = false;
    }
    const result = await this.caseTaskSchemaService.fetchTaskForCases(
      data.page,
      data.limit,
      data.search,
      data.sort,
      data.sort_by,
      data.filter,
      doSorting,
      data.case_rid,
      data.account_rid,
      schemaName,
      isExport,
      disablePagination
    );
    if (result.length > 0) {
      let allFilteredUsers;
      let allCaseTaskStatus;
      let allCaseTeamRoles;
      const userIds = [...new Set(result.map((d: any) => d.assigned_to))];
      const taskStatusIds = [
        ...new Set(result.map((d: any) => d.task_status_rid)),
      ];
      const roleIds = [...new Set(result.map((d: any) => d.role_rid))];

      let fetchStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
      let fetchUserQuery = rawQueries.getAllUsers(userIds);
      let fetchCaseTeamRolesQuery = rawQueries.getAllCaseTeamRoles(roleIds);

      if (fetchStatusQuery)
        allCaseTaskStatus = await mainDb.query(fetchStatusQuery);
      if (fetchUserQuery) allFilteredUsers = await mainDb.query(fetchUserQuery);
      if (fetchCaseTeamRolesQuery)
        allCaseTeamRoles = await mainDb.query(fetchCaseTeamRolesQuery);

      const userMap: Map<string, string> = new Map(
        allFilteredUsers?.[0].map((d: any) => [d.rid, d.name])
      );
      const taskStatusMap: Map<string, string> = new Map(
        allCaseTaskStatus?.[0].map((d: any) => [d.rid, d.task_status_name])
      );
      const roleMap: Map<string, string> = new Map(
        allCaseTeamRoles?.[0].map((d: any) => [d.rid, d.role_name])
      );

      let mapResult = result.map((d: any) => {
        return {
          ...d,
          task_status_name: taskStatusMap.get(d.task_status_rid) || null,
          assigned_to_name: userMap.get(d.assigned_to) || null,
          role_name: roleMap.get(d.role_rid) || null,
        };
      });

      if (
        mainTableFiltersForCase[data.sort] != undefined &&
        data.sort_by.toLowerCase() == "asc"
      ) {
        mapResult = mapResult.sort((a: any, b: any) => {
          const valA = a[data.sort];
          const valB = b[data.sort];

          // treat null, undefined, '' and ' ' as NULL
          const isNullA =
            valA === null || valA === undefined || valA.trim?.() === "";
          const isNullB =
            valB === null || valB === undefined || valB.trim?.() === "";

          // NULLS LAST
          if (isNullA && !isNullB) return 1;
          if (!isNullA && isNullB) return -1;
          if (isNullA && isNullB) return 0;

          // ASC
          return valA.localeCompare(valB);
        });
      } else if (
        mainTableFiltersForCase[data.sort] != undefined &&
        data.sort_by.toLowerCase() == "desc"
      ) {
        mapResult = mapResult.sort((a: any, b: any) => {
          const valA = a[data.sort];
          const valB = b[data.sort];

          const isNullA =
            valA === null || valA === undefined || valA.trim?.() === "";
          const isNullB =
            valB === null || valB === undefined || valB.trim?.() === "";

          // NULLS LAST
          if (isNullA && !isNullB) return 1;
          if (!isNullA && isNullB) return -1;
          if (isNullA && isNullB) return 0;

          // DESC
          return valB.localeCompare(valA);
        });
      }
      let finalData;
      if (isExport) {
        finalData = mapResult;
      } else {
        finalData = disablePagination
          ? mapResult.slice(
              (data.page - 1) * data.limit,
              data.page * data.limit
            )
          : mapResult;
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        data: finalData,
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: [],
      };
    }
  }

  async createOrMapTags(data: any) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const getActiveStatusId: any = await mainDb.query(
      rawQueries.getActiveStatusId()
    );
    let iterationCount = 0;
    let totalIteration = 0;
    data.tags.length = totalIteration;
    for (let d of data.tags) {
      iterationCount += 1;
      await this.caseTaskSchemaService.createOrUpdateTags(
        data.task_rid,
        data.account_rid,
        data?.case_rid,
        data.tag_rid,
        data.is_new_tag,
        fetchParent[0][0].r_number,
        data.userId,
        getActiveStatusId[0][0].rid
      ),
        data.task_type;
    }
    if (totalIteration === iterationCount) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.tagsCreatedSuccesfully,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.tagsCreationFailed,
      };
    }
  }

  async fetchTagsForDropdown(data: any) {
    const mainDb = await this.getMainDb();
    let mappedTagsResult: any[] = [];
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    if (data.action === "create") {
      mappedTagsResult = [];
      const result = await this.caseTaskSchemaService.fetchAllTags(
        mappedTagsResult
      );
      if (result.length > 0) {
        return {
          statusCode: HttpStatus.SUCCESS,
          data: result,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          data: [],
        };
      }
    } else {
      mappedTagsResult = await this.caseTaskSchemaService.fetchMappedTags(
        fetchParent[0][0].r_number,
        data.case_rid,
        data.account_rid,
        data.task_rid
      );
      const result = await this.caseTaskSchemaService.fetchAllTags(
        mappedTagsResult
      );
      if (result.length > 0) {
        return {
          statusCode: HttpStatus.SUCCESS,
          data: result,
        };
      } else {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          data: [],
        };
      }
    }
  }
  async addCommentsToTask(
    data: AddCommentsType,
    userId: string,
    files: Express.Multer.File[]
  ) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    data.created_by = userId;
    const [accountInfo]: any[] = await mainDb.query(
      rawQueries.fetchAccountInfo(data.account_rid),
      { type: QueryTypes.SELECT }
    );
    const fetchTaskDetails = await this.caseTaskSchemaService.findTaskById(
      data.task_rid,
      data.account_rid,
      data.case_rid,
      fetchParent[0][0].r_number,
      data.task_type
    );
    const result = await this.caseTaskSchemaService.addComments(
      data,
      fetchParent[0][0].r_number,
      fetchTaskDetails?.r_number!,
      files,
      accountInfo.r_number
    );
    if (result.statusCode == HttpStatus.SUCCESS) {
      return result;
    } else {
      return result;
    }
  }
  async exportTask(data: any, userId: string) {
    const result = await this.taskListForCases(data, true);
    if (result.statusCode === HttpStatus.SUCCESS) {
      const fields = await this.caseSchemaService.getAllowedExportFields(
        userId,
        "cases_workbreakdown_view_edit"
      );
      const allowedFieldSet = new Set<string>();
      for (const field of fields) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const finalData = result.data.map((d: any) => {
        let resultMap: { [key: string]: any } = {
          "Task Name": d.task_name,
          "Assigned To": d.assigned_to_name || "-",
          "Role To Be Assigned": d.role_name || "-",
          "Start Date": d.effective_start_datetime
            ? moment(d.effective_start_datetime).format("YYYY-MMM-DD")
            : "-",
          "Due Date": d.effective_end_datetime
            ? moment(d.effective_end_datetime).format("YYYY-MMM-DD")
            : "-",
          Status: d.task_status_name || "-",
        };
        const exportRecord: Record<string, any> = {};
        caseTaskMapping.forEach((mapping) => {
          if (allowedFieldSet.has(mapping.permissionField)) {
            exportRecord[mapping.exportField] = resultMap[mapping.exportField];
          }
        });
        return exportRecord;
      });
      const generateBase64Response = await generateExcelBase64(
        finalData,
        "Case Task"
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        data: generateBase64Response,
      };
    } else {
      return {
        statusCode: HttpStatus.SUCCESS,
        data: null,
      };
    }
  }
  async updateComments(
    data: UpdateCommentsType,
    userId: string,
    files: Express.Multer.File[]
  ) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    data.modified_by = userId;
    const [accountInfo]: any[] = await mainDb.query(
      rawQueries.fetchAccountInfo(data.account_rid),
      { type: QueryTypes.SELECT }
    );
    const fetchTaskDetails = await this.caseTaskSchemaService.findTaskById(
      data.task_rid,
      data.account_rid,
      data.case_rid,
      fetchParent[0][0].r_number,
      data.task_type
    );
    const result = await this.caseTaskSchemaService.updateComments(
      data,
      fetchParent[0][0].r_number,
      fetchTaskDetails?.r_number!,
      files,
      accountInfo.r_number
    );
    if (result?.statusCode === HttpStatus.SUCCESS) {
      return {
        statusCode: result.statusCode,
        statusMessage: result.statusMessage,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.commentsFailedUpdate,
      };
    }
  }
  async deleteComments(data: DeleteCommentsType, userId: string) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    data.modified_by = userId;
    const result = await this.caseTaskSchemaService.deleteComments(
      data,
      fetchParent[0][0].r_number
    );
    if (result?.statusCode === HttpStatus.SUCCESS) {
      const { CaseHistory, ActivityHistory } =
        await this.caseModelService.getModels(fetchParent[0][0].r_number);
      if (data.task_type !== "activity") {
        await CaseHistory.create({
          created_by: data.modified_by,
          created_datetime: new Date(),
          case_rid: data.case_rid,
          task_rid: data.task_rid,
          attribute_name: "Comments",
          old_value: "CREATE",
          new_value: "deleted a comment",
        });
      } else {
        await ActivityHistory.create({
          created_by: data.modified_by,
          created_datetime: new Date(),
          activity_rid: data.task_rid,
          attribute_name: "Comments",
          old_value: "CREATE",
          new_value: "deleted a comment",
        });
      }

      return {
        statusCode: result.statusCode,
        statusMessage: result.statusMessage,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.commentsFailedUpdate,
      };
    }
  }
  async fetchTaskComment(data: CommentsListType): Promise<any> {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();

    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result: any = await orgDb.query(
      fetchTaskComments(
        data.page,
        data.limit,
        data.task_rid,
        data.account_rid,
        data.case_rid,
        schemaName,
        data?.task_type || "milestone"
      )
    );
    if (result[0][0].comments !== null) {
      const total = result[0][0].comments[0].total_result;
      const userIds = [
        ...new Set(result[0][0].comments.map((d: any) => d.created_by)),
      ];
      const findUsers = await mainDb.query(rawQueries.getOwnerDetails(userIds));
      const userMap = new Map(
        findUsers[0].map((d: any) => [
          d.rid,
          { name: d.name, profile_url: d.profile_url },
        ])
      );
      const structuredData = await Promise.all(
        (result[0][0].comments || []).map(async (d: any) => {
          delete d.total_result;
          let createdByName;
          let profileUrl;
          const updatedAttachments = await Promise.all(
            (d.comments_attachments || []).map(async (da: any) => ({
              ...da,
              browse_file: da.browse_file
                ? await generateSasUrl(da.browse_file)
                : null,
            }))
          );
          if (userMap.get(d.created_by) !== undefined) {
            createdByName = userMap.get(d.created_by)?.name;
            if (userMap.get(d.created_by)?.profile_url !== null) {
              profileUrl = await generateSasUrl(
                userMap.get(d.created_by)?.profile_url
              );
            } else {
              profileUrl = null;
            }
          } else {
            profileUrl = null;
            createdByName = null;
          }
          return {
            ...d,
            created_by_name: createdByName,
            profile_url: profileUrl,
            comments_attachments: updatedAttachments,
          };
        })
      );
      const finalData = {
        page: data.page,
        limit: data.limit,
        total_result: total,
        data: structuredData,
      };
      return {
        statusCode: HttpStatus.SUCCESS,
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
        data: finalData,
      };
    }
  }

  async addTaskLevelAttachment(
    data: any,
    userId: string,
    files: Express.Multer.File[]
  ) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const [accountInfo]: any[] = await mainDb.query(
      rawQueries.fetchAccountInfo(data.account_rid),
      { type: QueryTypes.SELECT }
    );
    const result = await this.caseTaskSchemaService.addAttachmentForTask(
      data,
      fetchParent[0][0].r_number,
      files,
      userId,
      accountInfo.r_number
    );
    return result;
  }

  async deleteTaskLevelAttachment(data: any, userId: string) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.deleteAttachment(
      fetchParent[0][0].r_number,
      data,
      userId
    );
    return result;
  }

  async listTaskLevelAttachment(data: any) {
    const mainDb = await this.getMainDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.listTaskLevelAttachments(
      fetchParent[0][0].r_number,
      data
    );
    return result;
  }

  async fetchAllTaskActivities(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();

    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);

    const result = await orgDb.query<ActivityType>(
      fetchTaskActivities(
        data.page,
        data.limit,
        schemaName,
        data.case_rid,
        data.task_rid,
        data.task_type
      ),
      { type: QueryTypes.SELECT }
    );
    if (result.length > 0) {
      const userIds = [...new Set(result.map((d: any) => d.created_by))];
      const findUsers: any = await mainDb.query(
        rawQueries.getOwnerDetails(userIds)
      );
      const mapUser: Map<string, { name: string; profile_url: string }> =
        new Map(
          findUsers[0].map((d: any) => [
            d.rid,
            { name: d.name, profile_url: d.profile_url },
          ])
        );
      const total = parseInt(result[0]!.total_result);
      const structuredResult = await Promise.all(
        result.map(async (d: any) => {
          delete d.total_result;
          let createdByName;
          let profileUrl;
          if (mapUser.get(d.created_by) !== undefined) {
            createdByName = mapUser.get(d.created_by)?.name;
            if (mapUser.get(d.created_by)?.profile_url !== null) {
              profileUrl = await generateSasUrl(
                mapUser.get(d.created_by)?.profile_url!
              );
            } else {
              profileUrl = null;
            }
          } else {
            profileUrl = null;
            createdByName = null;
          }
          return {
            ...d,
            old_value: d.old_value === null ? "-" : d.old_value,
            new_value: d.new_value === null ? "-" : d.new_value,
            created_by_name: createdByName,
            profile_url: profileUrl,
          };
        })
      );
      const finalData = {
        page: data.page,
        limit: data.limit,
        total_result: total,
        data: structuredResult,
      };
      return {
        statusCode: HttpStatus.SUCCESS,
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
        data: finalData,
      };
    }
  }
  async fetchTaskCardDetailsList(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();

    const parentNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(parentNumber[0][0].r_number);
    const fetchChecklistStatusRid: any = await mainDb.query(
      rawQueries.fetchChecklistStatus()
    );
    let result = [];
    if (data.task_type === "activity") {
      result = await orgDb.query<TaskCardResponse>(
        taskCardDetailsActivityTask(
          schemaName,
          data.task_rid,
          data.account_rid,
          fetchChecklistStatusRid[0][0].rid
        ),
        { type: QueryTypes.SELECT }
      );
    } else {
      const getActiveId: any = await mainDb.query(
        rawQueries.getActiveStatusId()
      );
      result = await orgDb.query<TaskCardResponse>(
        taskCardDetails(
          schemaName,
          data.task_rid,
          data.account_rid,
          data.case_rid,
          fetchChecklistStatusRid[0][0].rid,
          getActiveId[0][0].rid
        ),
        { type: QueryTypes.SELECT }
      );
    }
    if (result.length > 0) {
      const findRole: any = await mainDb.query(
        rawQueries.getCaseTeamRoleName(
          result[0]?.task_details.case_team_member_role_rid!
        )
      );
      let userIds: Record<string, string> = {
        created_by: result[0]?.task_details.created_by!,
        assigned_to: result[0]?.task_details.assigned_to!,
        modified_by: result[0]?.task_details.modified_by!,
      };
      let priorityId = {
        priority_id: result[0]?.task_details.priority_rid!,
      };
      let taskStatusID = {
        task_status_rid: result[0]?.task_details.task_status_rid,
      };
      let weightageValue;
      if (
        result[0]?.task_details?.weightage_rid !== null &&
        data.task_type !== "activity"
      ) {
        const weightageRes: any = await mainDb.query(
          rawQueries.getWeightageValue(result[0]?.task_details.weightage_rid!)
        );
        weightageValue = weightageRes[0][0].weightage_value;
      } else {
        weightageValue = null;
      }
      let taskCategoryValue;
      if (
        result[0]?.task_details?.task_category_rid !== null &&
        data.task_type !== "activity"
      ) {
        const taskCategoryQuery: any = await mainDb.query(
          rawQueries.getTaskCategoryByRid(
            result[0]?.task_details.task_category_rid!
          )
        );
        taskCategoryValue = taskCategoryQuery[0][0].category_name;
      } else {
        taskCategoryValue = null;
      }

      let priority;
      let taskStatusType;
      const priorityIds: string[] = [];
      const taskStatusIds: string[] = [];
      let tagMap: Map<string, string> = new Map();
      let checklistItemsStatusIds: string[];
      let checkListData: any;
      let taskNameMap: Map<string, string> = new Map();
      let relationshipConnectorMap: Map<string, string>;
      let sourceIds;
      let targetIds;
      let taskIds = [];
      let relationshipConnectorIds;
      let taskNameResult;
      let workflowResult;
      if (
        result[0]?.task_details.workflow_connector !== null &&
        data.task_type !== "activity"
      ) {
        sourceIds = [
          ...new Set(
            result[0]?.task_details.workflow_connector.map(
              (d: taskWorkFlowConnector) => d.source_rid
            )
          ),
        ];
        targetIds = [
          ...new Set(
            result[0]?.task_details.workflow_connector.map(
              (d: taskWorkFlowConnector) => d.target_rid
            )
          ),
        ];
        relationshipConnectorIds = [
          ...new Set(
            result[0]?.task_details.workflow_connector.map(
              (d: taskWorkFlowConnector) => d.relationship_connector_rid
            )
          ),
        ];
        taskIds.push(...sourceIds, ...targetIds);
        let query = rawQueries.getTaskNames(taskIds, schemaName);
        let relationshipQuery = rawQueries.getWorkflowConnectors(
          relationshipConnectorIds
        );
        if (query) {
          taskNameResult = await orgDb.query(query);
          taskNameMap = new Map(
            taskNameResult[0].map((d: any) => [d.rid, d.task_name])
          );
        }
        if (relationshipQuery) {
          workflowResult = await mainDb.query(relationshipQuery);
          relationshipConnectorMap = new Map(
            workflowResult[0].map((d: any) => [d.rid, d.relationship_type])
          );
        }
      }
      if (
        result[0]?.task_details.checklists &&
        result[0]?.task_details?.checklists?.checklist_items !== null
      ) {
        checklistItemsStatusIds = [
          ...new Set(
            result[0]?.task_details.checklists.checklist_items.map(
              (d: ChecklistItems) => d.status_rid
            )
          ),
        ];
      } else {
        checklistItemsStatusIds = [];
      }

      const uniqueUserIds = [...new Set(Object.values(userIds))];
      if (result[0]?.task_details.tags !== null) {
        let tagIds = [
          ...new Set(
            result[0]?.task_details.tags.map((d: taskTags) => d.tag_rid)
          ),
        ];
        if (tagIds.length > 0) {
          let query = rawQueries.getAllTagsName(tagIds);
          if (query) {
            const findTagNames = await mainDb.query<TagsTypes>(query, {
              type: QueryTypes.SELECT,
            });
            if (findTagNames.length > 0) {
              tagMap = new Map(
                findTagNames.map((d: TagsTypes) => [d.rid, d.tag_name])
              );
            }
          }
        }
      }

      priorityIds.push(priorityId.priority_id);
      taskStatusIds.push(taskStatusID.task_status_rid!);
      const getUsers = await mainDb.query(
        rawQueries.getOwnerDetails(uniqueUserIds)
      );
      const fetchPriorityQuery = rawQueries.getAllPriorityTypes(priorityIds);
      const checkListStatusName: any = await mainDb.query(
        rawQueries.fetchCheckListStatusNamesByRids(
          MAIN_SCHEMA_NAME,
          checklistItemsStatusIds
        )
      );
      if (fetchPriorityQuery) {
        priority = await mainDb.query(fetchPriorityQuery);
      }
      let taskStatusQuery;
      // let taskStatusMap : Map<string, string> = new Map(taskStatusType?.[0]?.map((d : any) => [d.rid, d.task_status_name]));
      if (data.task_type === "activity") {
        taskStatusIds.push(taskStatusID.task_status_rid!);
        taskStatusQuery = rawQueries.fetchActivityStatus(taskStatusIds);
      } else {
        taskStatusQuery = rawQueries.getAllTaskStatus(taskStatusIds);
      }
      if (taskStatusQuery) {
        taskStatusType = await mainDb.query(taskStatusQuery);
      }
      let taskStatusMap: Map<string, string>;
      if (data.task_type === "activity") {
        taskStatusMap = new Map(
          taskStatusType?.[0]?.map((d: any) => [d.rid, d.name])
        );
      } else {
        taskStatusMap = new Map(
          taskStatusType?.[0]?.map((d: any) => [d.rid, d.task_status_name])
        );
      }

      let priorityMap: Map<string, string> = new Map(
        priority?.[0]?.map((d: any) => [d.rid, d.priority_name])
      );
      let assignedToMap: Map<string, any> = new Map(
        getUsers?.[0]?.map((d: any) => [
          d.rid,
          { name: d.name, profile_url: d.profile_url },
        ])
      );
      let checkListItemsMap: Map<string, string> = new Map(
        checkListStatusName?.[0]?.map((d: any) => [d.rid, d.status_name])
      );

      const resData = result[0];
      if (result[0]?.task_details.checklists === null) checkListData = null;
      else
        checkListData = {
          rid: resData?.task_details.checklists.rid,
          task_rid: resData?.task_details.checklists.task_rid,
          checklist_name: resData?.task_details.checklists.checklist_name,
          checklist_description:
            resData?.task_details.checklists.checklist_description,
          checklist_items_count:
            resData?.task_details.checklists.checklist_items_count,
          completed_items_count:
            resData?.task_details.checklists.completed_items_count,
          checklist_items:
            resData?.task_details.checklists.checklist_items !== null
              ? resData?.task_details.checklists.checklist_items.map(
                  (d: ChecklistItems) => {
                    return {
                      rid: d.rid,
                      status_rid: d.status_rid,
                      checklist_item_status_name:
                        checkListItemsMap.get(d.status_rid) || null,
                      checklist_item_name: d.checklist_item_name,
                      checklist_item_description: d.checklist_item_description,
                    };
                  }
                )
              : [],
        };
      let finalWorkflowData;
      if (data.task_type !== "activity") {
        if (result[0]?.task_details.workflow_connector === null) {
          finalWorkflowData = [];
        } else {
          finalWorkflowData =
            result[0]?.task_details?.workflow_connector
              ?.filter((f: any) => f.rid !== null)
              .map((d: any) => {
                return {
                  ...d,
                  source_task_name: taskNameMap.get(d.source_rid),
                  target_task_name: taskNameMap.get(d.target_rid),
                  relationship_name: relationshipConnectorMap.get(
                    d.relationship_connector_rid
                  ),
                };
              }) || [];
        }
      }
      let profileUrl;
      let createdByName;
      let modifiedByName;
      let assignedToName;
      if (assignedToMap.get(resData?.task_details.assigned_to!) !== undefined) {
        assignedToName = assignedToMap.get(
          resData?.task_details.assigned_to!
        ).name;
        if (
          assignedToMap.get(resData?.task_details.assigned_to!).profile_url !==
          null
        ) {
          profileUrl = await generateSasUrl(
            assignedToMap.get(resData?.task_details.assigned_to!).profile_url
          );
        } else {
          profileUrl = assignedToMap.get(
            resData?.task_details.assigned_to!
          ).profile_url;
        }
      } else {
        profileUrl = null;
        assignedToName = null;
      }
      if (assignedToMap.get(resData?.task_details.created_by!) !== undefined) {
        createdByName = assignedToMap.get(
          resData?.task_details.created_by!
        ).name;
      } else {
        createdByName = null;
      }
      if (
        (modifiedByName =
          assignedToMap.get(resData?.task_details.modified_by!) !== undefined)
      ) {
        modifiedByName = modifiedByName = assignedToMap.get(
          resData?.task_details.modified_by!
        ).name;
      } else {
        modifiedByName = null;
      }
      let finalStruture = {
        rid: resData?.task_details.rid,
        r_number: resData?.task_details.r_number,
        task_name: resData?.task_details.task_name,
        is_flagged: resData?.task_details.is_flagged || false,
        created_by: resData?.task_details.created_by,
        fiscal_year: resData?.task_details.fiscal_year || null,
        created_by_name: createdByName,
        profile_url: profileUrl,
        assigned_to: resData?.task_details.assigned_to,
        assigned_to_name: assignedToName,
        modified_by: resData?.task_details.modified_by,
        modified_by_name: modifiedByName,
        priority_rid: resData?.task_details.priority_rid,
        priority_name:
          priorityMap.get(resData?.task_details.priority_rid!) || null,
        task_status_rid: resData?.task_details.task_status_rid,
        task_status_name:
          taskStatusMap.get(resData?.task_details.task_status_rid!) || null,
        created_datetime: new Date(
          resData?.task_details.created_datetime!
        ).toISOString(),
        task_description:
          data.task_type !== "activity"
            ? resData?.task_details.task_description
            : resData?.task_details.description,
        effective_start_datetime:
          resData?.task_details.effective_start_datetime,
        effective_end_datetime: resData?.task_details.effective_end_datetime,
        checklist_rid:
          data.task_type === "activity"
            ? resData?.task_details?.checklist_rid
            : resData?.task_details?.checklists?.rid,
        checklist_name: resData?.task_details?.checklists?.checklist_name,
        case_team_member_role_rid:
          resData?.task_details.case_team_member_role_rid,
        case_team_member_role_name:
          findRole[0][0] !== undefined ? findRole[0][0].role_name : null,
        weightage_rid: resData?.task_details?.weightage_rid,
        weightage_value: weightageValue,
        task_category_rid: resData?.task_details?.task_category_rid,
        task_category_name: taskCategoryValue,
        checklists: checkListData,
        tags:
          resData?.task_details.tags
            .filter((f: taskTags) => f.tag_rid !== null)
            .map((d: taskTags) => {
              return {
                tag_rid: d.tag_rid,
                tag_name: tagMap.get(d.tag_rid) || null,
              };
            }) || [],
        workflow_connector: finalWorkflowData,
      };
      return {
        statusCode: HttpStatus.SUCCESS,
        data: finalStruture,
      };
    } else {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        data: null,
      };
    }
  }
  async addCollaboratorToTask(data: any) {
    const mainDb = await this.getMainDb();
    const parentNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.addCollaborators(
      data,
      parentNumber[0][0].r_number
    );
    return result;
  }
  async getCollaboratorsList(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const parentNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let result = await this.caseTaskSchemaService.fetchCollaboratorsList(
      parentNumber[0][0].r_number,
      data
    );
    if (result.length > 0) {
      let userLists;
      let userMap: Map<string, { name: string; profile_url: string }>;
      const uniqueIds = [...new Set(result.map((d: any) => d.assigned_to))];
      if (uniqueIds.length > 0) {
        userLists = await mainDb.query(rawQueries.getOwnerDetails(uniqueIds));
        let assignedToName;
        let profileUrl;
        userMap = new Map(
          userLists[0].map((d: any) => [
            d.rid,
            { name: d.name, profile_url: d.profile_url },
          ])
        );
        result = await Promise.all(
          result.map(async (d: any) => {
            if (userMap.get(d.assigned_to) !== undefined) {
              assignedToName = userMap.get(d.assigned_to)?.name;
              if (userMap.get(d.assigned_to)?.profile_url !== null) {
                profileUrl = await generateSasUrl(
                  userMap.get(d.assigned_to)?.profile_url!
                );
              } else {
                profileUrl = null;
              }
            } else {
              assignedToName = null;
              profileUrl = null;
            }
            return {
              ...d,
              assigned_to_name: assignedToName,
              profile_url: profileUrl,
            };
          })
        );
        return result;
      } else {
        return [];
      }
    } else return [];
  }
  async linkTask(data: CaseTaskWorkFlowCreate) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    const accountNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.taskWorkflowConnector(
      accountNumber[0][0].r_number,
      data,
      transaction
    );
    return result;
  }
  async deleteLinkTask(data: CaseTaskWorkFlowCreate) {
    const mainDb = await this.getMainDb();
    const accountNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.deleteTaskWorkConnector(
      accountNumber[0][0].r_number,
      data
    );
    return result;
  }
  async deleteTagsAccountLevel(data: any) {
    const mainDb = await this.getMainDb();
    const accountNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.deleteTags(
      accountNumber[0][0].r_number,
      data.case_rid,
      data.account_rid,
      data.task_rid,
      data.tag_rid,
      data.userId,
      data?.task_type || "case_task"
    );
    return result;
  }
  async deleteCollaborators(data: any) {
    const mainDb = await this.getMainDb();
    const accountNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.caseTaskSchemaService.deleteCollaborators(
      accountNumber[0][0].r_number,
      data
    );
    return result;
  }
  async updateChecklistItemsStatus(data: any) {
    const mainDb = await this.getMainDb();
    const dbInit = await this.caseModelService.getSequelize();
    const transaction = await dbInit.transaction();
    const accountNumber: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    const result = await this.checklistSchemaService.updateChecklistItems(
      data,
      accountNumber[0][0].r_number,
      transaction
    );
    if (result === 1) {
      return {
        statusCode: HttpStatus.SUCCESS,
        statusMessage: STATUS_MESSAGE.checklistItemsStatusSuccess,
      };
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.failedToUpdate,
      };
    }
  }
  async getTaskDropDownForDependencyMapping(data: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const fetchParent: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb)
    );
    let schemaName = rawQueries.fetchSchemaName(fetchParent[0][0].r_number);
    const { Case } = await this.caseModelService.getModels(
      fetchParent[0][0].r_number
    );
    const checkCaseStatus = await Case.findOne({
      where: { rid: data.case_rid },
      raw: true,
    });
    let finalResult;
    if (checkCaseStatus) {
      const [fetchCaseStatus] = await mainDb.query<CaseStatusType>(
        rawQueries.getCaseStatusById(checkCaseStatus.status_rid),
        { type: QueryTypes.SELECT }
      );
      const [fetchMilestoneReview] = await mainDb.query<TaskTypeResponse>(
        rawQueries.getMilestoneReview(),
        { type: QueryTypes.SELECT }
      );
      if (fetchCaseStatus?.status_name === "Audit Review") {
        if (fetchMilestoneReview !== undefined) {
          finalResult = await orgDb.query<CaseTaskDropdownType>(
            rawQueries.getTaskDropdownForCaseLevel(
              schemaName,
              data.case_rid,
              data.account_rid,
              true,
              ""
            ),
            { type: QueryTypes.SELECT }
          );
          return finalResult;
        } else return [];
      } else {
        finalResult = await orgDb.query<CaseTaskDropdownType>(
          rawQueries.getTaskDropdownForCaseLevel(
            schemaName,
            data.case_rid,
            data.account_rid,
            false,
            fetchMilestoneReview!.rid
          ),
          { type: QueryTypes.SELECT }
        );
        return finalResult;
      }
    } else return [];
  }
  async getCasePriortyList() {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<priorityTypes>(
      rawQueries.getPriorityTypes(),
      { type: QueryTypes.SELECT }
    );
    return result;
  }
  async getCaseTaskStatusList() {
    const mainDb = await this.getMainDb();
    const result = await mainDb.query<caseTaskStatusTypes>(
      listAllTaskStatus(),
      { type: QueryTypes.SELECT }
    );
    return result;
  }
}
