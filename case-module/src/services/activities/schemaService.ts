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
import { CaseModelService } from "../caseModelsService";
import {
  HttpStatus,
  MAIN_SCHEMA_NAME,
  rawQueries,
  STATUS_MESSAGE,
  meetingFields,
  activityStatus,
  constants,
  callFields,
  activityTypes
} from "../../utils/constants";
import {
  decryptClientSecret,
  deleteFromAzureBlob,
  errorLog,
  generateSasUrl,
  logMessage,
  uploadToAzureBlob,
} from "../../utils/helpers";
import {
  IActivityCall,
  IActivityEmail,
  IActivityMeeting,
  IActivityTask,
  ICreateChecklist
} from "../../utils/types";

import {
  fetchActivityDetails,
  fetchEmailActivityDetails,
} from "../../utils/rawQueries";

import {
  TaskCollaborators,
} from "../../models/taskCollaboratorsModel";
import CaseSchemaService from "../cases/schemaService";
import { sendEmailWithAttachment } from "../emailService";
import { scheduleTeamsMeetingUtil } from "../../utils/teamsMeetingUtil";
import moment from "moment";
import { ChecklistSchemaService } from "../cases/caseChecklist/checklistSchemaService";
import { CaseTaskSchemaService } from "../cases/caseTask/caseTaskSchemaService";
import { HelperMethods } from "../cases/helperMethods";
class ActivitySchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private caseModelService: CaseModelService;
  private caseSchemaService: CaseSchemaService;
  private caseChecklistSchemaService : ChecklistSchemaService
  private caseTaskSchemaService : CaseTaskSchemaService
  private helperMethod : HelperMethods

  constructor() {
    this.caseModelService = new CaseModelService();
    this.caseSchemaService = new CaseSchemaService();
    this.caseChecklistSchemaService = new ChecklistSchemaService()
    this.caseTaskSchemaService = new CaseTaskSchemaService()
    this.helperMethod = new HelperMethods(
      this.caseModelService
    );
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

   /**
     * Uploads files to Azure Blob and creates ActivityAttachments records
     */
    async uploadActivityFiles(files: Express.Multer.File[] | undefined, activityRequest: any, accountNumber: string) {
      const { ActivityAttachments } = await this.caseModelService.getModels(accountNumber);
      if (!files) return;
      if(!this.mainDbSequelize){  
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
      const [accountData]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountDetailsByRid(activityRequest.account_rid),{
          type: QueryTypes.SELECT,
        }
      );

      for (let f of files) {
        const uploadFile = await uploadToAzureBlob(
          f,
          activityRequest.account_rid,
          accountNumber,
          accountData.r_number,
          "cases"
        );
        if (uploadFile) {
          const attachmentPayload: any = {
            created_by: activityRequest.created_by,
            created_datetime: new Date(),
            account_rid: activityRequest.account_rid,
            activity_rid: activityRequest.activity_rid,
            browse_file: uploadFile.url,
            size: uploadFile.size.toString(),
            format: uploadFile.extension,
            document_name: uploadFile.name,
            is_file_deleted: false,
          };
          await ActivityAttachments.create(attachmentPayload);
        }
      }
    }

  async fetchCheckListForTask(accountNumber: string, caseRid: string) {
    try {
      const { CheckList, CheckListItem } =
        await this.caseModelService.getModels(accountNumber);
      const checklistData = await CheckList.findOne({
        where: { rid: caseRid },
      });
      const checklistItems = await CheckListItem.findAll({
        attributes: [
          "checklist_item_name",
          "checklist_item_description",
          "status_rid",
        ],
        where: { checklist_rid: checklistData?.rid },
      });

      // Fetch status names for each status_rid
      const statusRids = [
        ...new Set(
          checklistItems.map((item) => item.status_rid).filter(Boolean)
        ),
      ].filter((rid): rid is string => typeof rid === "string");
      let statusMap: Record<string, string> = {};
      if (statusRids.length > 0) {
        if (!this.mainDbSequelize) {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
        const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
          /\D/g,
          ""
        )}`;
        const statusQuery = rawQueries.fetchCheckListStatusNamesByRids(
          schemaName,
          statusRids
        );
        const statusResults = await this.mainDbSequelize.query(statusQuery, {
          type: "SELECT",
        });
        statusMap = Object.fromEntries(
          statusResults.map((s: any) => [s.rid, s.status_name])
        );
      }

      // Attach status_name to each checklist item
      const response = checklistItems.map((item) => ({
        ...(item.get ? item.get({ plain: true }) : item),
        status_name: item.status_rid
          ? statusMap[item.status_rid] || null
          : null,
      }));

      return {
        checklistData,
        checklistItems: response,
      };
    } catch (err) {
      logMessage(`Error fetching checklist for task: ${err}`);
      throw new Error(
        "Error fetching checklist for task: " + (err as Error).message
      );
    }
  }
 
  async createActivityTask(
    accountNumber: string,
    taskRequest: IActivityTask,
    transaction: Transaction
  ) {
    // Implementation for creating interactions in the database
    try {
      const { Activities } = await this.caseModelService.getModels(
        accountNumber
      );

      // Ensure account_rid is properly set and not undefined
      const activityData = {
        ...taskRequest,
        activity_type: "Task",
        account_rid: taskRequest.accountRid || taskRequest.account_rid || "",
      };

      const casecreationResponse = await Activities.create(activityData, {
        transaction,
      });

      await this.addTaskManagementTimeline(
        accountNumber,
        casecreationResponse.rid,
        taskRequest.account_rid!,
        taskRequest,
        taskRequest.created_by || "",
        "created",
        "success",
        null,
        taskRequest.attachment_level || "case"
      );

      return casecreationResponse;
    } catch (error) {
      logMessage(`Error creating activity: ${error}`);
      throw new Error("Error creating activity: " + error);
    }
  }

  async addTaskSummary( 
    accountNumber: string,
    taskRequest: IActivityTask,
    taskRid: string,
    taskRNumber: string
  )
  {
    const { TaskSummary } = await this.caseModelService.getModels("");
       await TaskSummary.create(
        {
          task_rid: taskRid,
          r_number: taskRNumber || "",
          account_rid: taskRequest.account_rid || "",
          attach_to: taskRequest.attach_to || "",
          attachment_level: taskRequest.attachment_level || "",
          task_name: taskRequest.task_name || "",
          description: taskRequest.description || "",
          fiscal_year: taskRequest.fiscal_year || 0,
          assigned_to: taskRequest.assigned_to || "",
          status_rid: taskRequest.status_rid || "",
          priority_rid: taskRequest.priority_rid || "",
          effective_start_datetime: taskRequest.effective_start_datetime,
          effective_end_datetime: taskRequest.effective_end_datetime,
          created_by: taskRequest.created_by || "",
          created_datetime: new Date(),
          task_type_rid: taskRequest.task_type_rid || ""
        }
      ); 

  }
  async updateActivityTask(
    accountNumber: string,
    taskRequest: IActivityTask,
    transaction: Transaction,
    userId: string
  ) {
    // Implementation for updating interactions in the database
    try {
      const { Activities,TaskSummary, CheckList, CheckListItem } = await this.caseModelService.getModels(
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
      if(taskRequest?.checklist_rid) 
            {
              if(taskRequest.checklist_rid !== existingTask?.checklist_rid) {
                if(existingTask?.checklist_rid !== null && existingTask?.checklist_rid !== '') {
                  const checklistResult = await CheckList.findOne({
                  where : {
                    attach_to : taskRequest.task_rid,
                    attachment_level : 'task',
                    checklist_template_rid : existingTask?.checklist_rid
                  }, raw : true
                })

                if(checklistResult) {
                  await CheckListItem.destroy({
                    where : {
                      checklist_rid : checklistResult.rid
                    }
                  })
                  await CheckList.destroy({
                    where : {
                      attach_to : taskRequest.task_rid,
                      attachment_level : 'task',
                      checklist_template_rid : existingTask?.checklist_rid
                    }
                  })
                  }
                }
                const response  = await this.helperMethod.fetchChecklistTemplateDetailsById(taskRequest.checklist_rid);
                response.checklist_items = response.checklist_items.map((item:any) => item.get ? item.get({ plain: true }) : item);
                response.checklist_items.map((item:any) => item.action_type  = 'add');
                let caseRequest : any = {
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
                if(checklistResponse)
                  await this.helperMethod.manageCheckListItems(accountNumber,caseRequest,checklistResponse.rid, transaction);
                }
            }
      // Combine update: include modified_by and modified_datetime in the same update
      const [updatedResult] = await Activities.update(
        {
          ...taskRequest,
          description: taskRequest.task_description,
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
    if(updatedResult > 0) {
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
       await TaskSummary.update(
        {
          task_name: taskRequest.task_name || "",
          description: taskRequest.task_description || "",
          assigned_to: taskRequest.assigned_to || "",
          status_rid: taskRequest.status_rid || "",
          priority_rid: taskRequest.priority_rid || "",
          effective_start_datetime: taskRequest.effective_start_datetime,
          effective_end_datetime: taskRequest.effective_end_datetime,
          modified_by: taskRequest.modified_by || "",
          modified_datetime: new Date(),
        },
        {
          where: {
            task_rid: taskRequest.task_rid,
          }
        }
      );
      await this.addActivityTaskHistory(
        accountNumber,
        taskRequest.task_rid as string,
        { ...taskRequest, modified_by: userId, description: taskRequest.task_description },
        existingTask,
        activityTypes.task
      );
      if(!this.mainDbSequelize)
        {
          this.mainDbSequelize = await this.caseModelService.getMainSequelize();
        }
      const [activeStatusRid]: any[] = await this.mainDbSequelize.query(
                rawQueries.getActiveStatusId()
              );
        if(taskRequest.tags.length > 0) {
            for(let d of taskRequest.tags) {
              await this.caseTaskSchemaService.createOrUpdateTags(
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
    async createCheckListForTask(
      accountNumber: string,
      caseRequest: ICreateChecklist,
      transaction: Transaction
    ) {
      // Implementation for creating checklist in the database
      try {
        const { CheckList } = await this.caseModelService.getModels(accountNumber);
        const findCheckListAlreadyCreated = await CheckList.findOne({
          where : {
            attach_to : caseRequest.attach_to,
            attachment_level : "task",
            checklist_template_rid : caseRequest.checklist_rid
          }, raw : true
        });
        if(!findCheckListAlreadyCreated) {
          const createdChecklist = await CheckList.create(
          {
            account_rid: caseRequest.account_rid,
            attach_to: caseRequest.attach_to,
            attachment_level: caseRequest.attachment_level,
            checklist_name: caseRequest.checklist_name,
            checklist_description: caseRequest.checklist_description,
            checklist_template_rid: caseRequest.checklist_rid || "",
            fiscal_year:caseRequest.fiscal_year,
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

  async  checkUserAPIPermission  (
      userId: string,
      profileId: string,
      permissionName: string
    ): Promise<boolean> {
      const sequelize = await initMainDbSequelize();
    
      // Get permissionId from module_permission table
      const permissionResult = await sequelize.query(
        constants.SQL_GET_PERMISSION,
        {
          replacements: { permissionName },
          type: constants.SELECT
        }
      ) as Array<{ rid: string }>;
      if (!permissionResult.length || !permissionResult[0]) return false;
    
      const permissionId = permissionResult[0].rid;
    
      // Check enable status for profile access
      const profileAccessResult = await sequelize.query(
        constants.SQL_GET_PROFILE_ACCESS,
        {
          replacements: { profileId, permissionId },
          type: constants.SELECT
        }
      ) as Array<{ is_enabled: boolean }>;
    
      // Check enable status for user access
      const userAccessResult = await sequelize.query(
        constants.SQL_GET_USER_ACCESS,
        {
          replacements: { userId, permissionId },
          type: constants.SELECT
        }
      ) as Array<{ is_enabled: boolean }>;
    
      const isEnabled =
        (profileAccessResult.length > 0 && profileAccessResult[0] && profileAccessResult[0].is_enabled) ||
        (userAccessResult.length > 0 && userAccessResult[0] && userAccessResult[0].is_enabled);
    
     
      return !!isEnabled;
    };
  async fetchActivities(
    accountNumber: string,
    fiscalYear: number,
    attachmentLevel?: string,
    entityId?: string,
    accountRid?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "DESC",
    apiType: string = "list",
    accessibleIds: string[] = [],
    activity_type: string = 'All',
    userId: string = '',
    graphqlData?: any
  ) {
    try {
      const { Activities } = await this.caseModelService.getModels(
        accountNumber
      );
      let allActivities: any[] = [];

      // Handle attached_to and uploaded_by filters separately
      //let attachedToFilter;
      // Generic filter extraction
      const filterKeys = [
        { key: 'attached_to', var: 'attachedToFilter' },
        { key: 'created_by_name', var: 'createdByFilter' },
        { key: 'modified_by_name', var: 'modifiedByFilter' },
        { key: 'assigned_to_name', var: 'assignedToFilter' },
        { key: 'status_name', var: 'statusFilter' },
        { key: 'to_email', var: 'toEmailFilter' }
      ];
      const extractedFilters: Record<string, any> = {
        attachedToFilter: null,
        createdByFilter: null,
        modifiedByFilter: null,
        assignedToFilter: null,
        statusFilter: null,
        toEmailFilter: null
      };
      for (const { key, var: varName } of filterKeys) {
        if (filters[key]) {
          extractedFilters[varName] = filters[key];
          delete filters[key];
        }
      }
      const attachedToFilter = extractedFilters.attachedToFilter;
      const createdByFilter = extractedFilters.createdByFilter;
      const modifiedByFilter = extractedFilters.modifiedByFilter;
      const assignedToFilter = extractedFilters.assignedToFilter;
      const statusFilter = extractedFilters.statusFilter;
      const toEmailFilter = extractedFilters.toEmailFilter;
      if(!this.mainDbSequelize){
            this.mainDbSequelize = await this.caseModelService.getMainSequelize();
          } 

      const { whereClause } = this.buildRawWhereClauseActivities(
        filters,
        search
      );
      if (fiscalYear !== 0) {
        if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ fiscal_year: fiscalYear });
      }
      if(activity_type != 'All'){
        if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
          whereClause[Op.and] = [];
        }
        whereClause[Op.and].push({ activity_type: activity_type });
      }
      else
      {
         if (!this.mainDbSequelize) {
            this.mainDbSequelize = await this.caseModelService.getMainSequelize();
         }

       let  whereClauseuser = '"user".rid = :userId';
        const [profileInfo]:any[] = await this.mainDbSequelize.query(
        constants.SQL_GET_USER.replace("{whereClause}", whereClauseuser),
        {
          replacements: { userId },
          type: constants.SELECT
        }
      );
    let accessActivity = [];
    const taskAccess = await this.checkUserAPIPermission(userId, profileInfo.profile_rid, "activity_task_view_edit");
    const emailAccess = await this.checkUserAPIPermission(userId, profileInfo.profile_rid, "activity_email_view_edit");
    const meetingAccess = await this.checkUserAPIPermission(userId, profileInfo.profile_rid, "activity_meeting_view_edit");
    const callAccess = await this.checkUserAPIPermission(userId, profileInfo.profile_rid, "activity_call_view_edit");
   if(taskAccess){
    accessActivity.push('Task');
  }
  if(emailAccess){
    accessActivity.push('Email');
  }
  if(meetingAccess){
    accessActivity.push('Meeting');
  }
  if(callAccess){
    accessActivity.push('Call');
  }
  if (accessActivity.length > 0) {
    if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
      whereClause[Op.and] = [];
    }
    whereClause[Op.and].push({ activity_type: { [Op.in]: accessActivity } });
  } else {
    return { activities: [], totalCount: 0 };
  }
      }
      

      const fetchAttachments = async (
        model: any,
        level: string,
        attachToIds: string[]
      ) => {
        if (attachToIds.length === 0) return [];
        let where;
        where = {
          [Op.and]: [
            { attachment_level: level },
            { attach_to: { [Op.in]: attachToIds } },
            ...(whereClause[Op.and] || []),
          ],
        };
        return model.findAll({
          where
        });
      };
      // 🔷 Optimized project resource + task attachments fetch for multiple projects
      const fetchProjectResourceTaskAttachmentsBulk = async (
        model: any,
        projectIds: string[]
      ) => {
        let projectChildAttachments: any[] = [];
        if (projectIds.length === 0) return projectChildAttachments;

        // 🔹 Fetch all project_resources under projects in one call
        const projectResources =
          await this.helperMethod.getProjectResourcesByProjectIds(
            accountNumber,
            projectIds
          );
        const projectResourceIds = projectResources.map((r) => r.rid);

        if (projectResourceIds.length > 0) {
          const projectResourceAttachments = await fetchAttachments(
            model,
            "project_resource",
            projectResourceIds
          );
          projectChildAttachments.push(...projectResourceAttachments);
        }

        // 🔹 Fetch all project_tasks under projects in one call
        const projectTasks =
          await this.helperMethod.getProjectTasksByProjectIds(
            accountNumber,
            projectIds
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);

        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            model,
            "project_task",
            projectTaskIds
          );
          projectChildAttachments.push(...projectTaskAttachments);
        }

        return projectChildAttachments;
      };

      // 🔷 Optimized resource cost and skill attachments fetch for multiple resources
      const fetchResourceCostSkillAttachmentsBulk = async (
        model: any,
        resourceIds: string[]
      ) => {
        let resourceCostSkillAttachments: any[] = [];
        if (resourceIds.length === 0) return resourceCostSkillAttachments;

        // 🔹 Fetch all resource_costs in one call
        const resourceCosts =
          await this.helperMethod.getResourceCostsByResourceIds(
            accountNumber,
            resourceIds
          );
        const allResourceCostIds = resourceCosts.map((rc) => rc.rid);
        if (allResourceCostIds.length > 0) {
          const resourceCostAttachments = await fetchAttachments(
            model,
            "resource_cost",
            allResourceCostIds
          );
          resourceCostSkillAttachments.push(...resourceCostAttachments);
        }

        // 🔹 Fetch all resource_skills in one call
        const resourceSkills =
          await this.helperMethod.getResourceSkillsByResourceIds(
            accountNumber,
            resourceIds
          );
        const allResourceSkillIds = resourceSkills.map((rs) => rs.rid);
        if (allResourceSkillIds.length > 0) {
          const resourceSkillAttachments = await fetchAttachments(
            model,
            "resource_skill",
            allResourceSkillIds
          );
          resourceCostSkillAttachments.push(...resourceSkillAttachments);
        }

        return resourceCostSkillAttachments;
      };
      if (attachmentLevel === "case" && entityId) {
        const caseAttachments = await fetchAttachments(Activities, "case", [
          entityId,
        ]);
        allActivities.push(...caseAttachments);
      } else if (attachmentLevel === "account" && entityId) {
        const accountAttachments = await fetchAttachments(
          Activities,
          "account",
          [entityId]
        );
        allActivities.push(...accountAttachments);
         const cases = await this.helperMethod.getCasesByAccountId(
          accountNumber,
          entityId
        );
         const caseIds = cases.map((r:any) => (r as { rid: string }).rid);
        const caseAttachments = await fetchAttachments(Activities, "case", caseIds);
        allActivities.push(...caseAttachments);

        const projects = await this.helperMethod.getProjectsByAccountId(
          accountNumber,
          entityId,accessibleIds
        );
        const projectIds = projects.map((p: { rid: any }) => p.rid);
        if (projectIds.length > 0) {
          const projectAttachments = await fetchAttachments(
            Activities,
            "project",
            projectIds
          );
          allActivities.push(...projectAttachments);

          const projectChildAttachments =
            await fetchProjectResourceTaskAttachmentsBulk(
              Activities,
              projectIds
            );
          allActivities.push(...projectChildAttachments);
        }

        const resources = await this.helperMethod.getResourcesByAccountId(
          accountNumber,
          entityId
        );
        const resourceIds = resources.map((r) => (r as { rid: string }).rid);
        if (resourceIds.length > 0) {
          const resourceAttachments = await fetchAttachments(
            Activities,
            "resource",
            resourceIds
          );

          const resourceCostSkillAttachments =
            await fetchResourceCostSkillAttachmentsBulk(
              Activities,
              resourceIds
            );
          allActivities.push(...resourceCostSkillAttachments);
        }
      } else if (attachmentLevel === "project" && entityId) {
        const projectAttachments = await fetchAttachments(
          Activities,
          "project",
          [entityId]
        );
        allActivities.push(...projectAttachments);

        const projectChildAttachments =
          await fetchProjectResourceTaskAttachmentsBulk(Activities, [entityId]);
        allActivities.push(...projectChildAttachments);
      }
      // 🔷 Project_resource logic
      else if (attachmentLevel === "project_resource" && entityId) {
        const projectResourceAttachments = await fetchAttachments(
          Activities,
          "project_resource",
          [entityId]
        );
        allActivities.push(...projectResourceAttachments);
        const projectResource =
          await this.helperMethod.fetchProjectResourceById(
            accountNumber,
            entityId
          );
        const projectTasks =
          await this.helperMethod.getProjectTasksByProjectIds(
            accountNumber,
            [(projectResource as any)?.project_fiscal_rid]
          );
        const projectTaskIds = projectTasks.map((t) => t.rid);
        if (projectTaskIds.length > 0) {
          const projectTaskAttachments = await fetchAttachments(
            Activities,
            "project_task",
            projectTaskIds
          );
          allActivities.push(...projectTaskAttachments);
        }
      }

      // 🔷 Resource logic
      else if (attachmentLevel === "resource" && entityId) {
        const resourceAttachments = await fetchAttachments(
          Activities,
          "resource",
          [entityId]
        );
        allActivities.push(...resourceAttachments);

        const resourceCostSkillAttachments =
          await fetchResourceCostSkillAttachmentsBulk(Activities, [entityId]);
        allActivities.push(...resourceCostSkillAttachments);
      } else {
        if (!whereClause[Op.and] || !Array.isArray(whereClause[Op.and])) {
          whereClause[Op.and] = [];
        }
        if (entityId) {
          whereClause[Op.and].push({ attach_to: entityId });
        } else if (attachmentLevel) {
          whereClause[Op.and].push({ attachment_level: attachmentLevel });
        }

        try {
          const result = await Activities.findAll({ where: whereClause });
          allActivities.push(...result);
        } catch (error) {
          throw new Error("Failed to fetch attachments");
        }
      }
       let statusIds: any[] = [
            ...new Set(allActivities.map((status: any) => status?.status_rid)),
        ];
        let fetchStatusInfo = await this.mainDbSequelize.query(
                rawQueries.fetchActivityStatus(statusIds)
              );
        let statusMap: Map<string, string> = new Map(
        fetchStatusInfo[0].map((status: any) => [status.rid, status.name])
      );
      let assignedUserIds: any[] = [
            ...new Set(allActivities.map((user: any) => user?.assigned_to)),
        ];

      const [assignedUserNames] = await Promise.all([
        assignedUserIds.length > 0
          ? this.mainDbSequelize.query(rawQueries.listUsersByIds(assignedUserIds), {
              replacements: { userIds: assignedUserIds },
              type: "SELECT",
            })
          : Promise.resolve([]),
      ]);
      const assignedUserMap = new Map(assignedUserNames.map((u: any) => [u.rid, u.full_name]));

      // 🔷 Fetch display names
      if (graphqlData?.document_rid) {
        allActivities = allActivities.filter((d: any) => d != null);
      }
      const { displayNames } =
        await this.helperMethod.getAttachmentDisplayNames(
          allActivities,
          accountNumber
        );
      if (attachedToFilter) {
        allActivities = allActivities.filter((attachment) => {
          let displayName =
            displayNames[attachment.rid] || String(attachment.attach_to) || "";
          const displayValue = displayName.toLowerCase();
          const operator = Object.keys(attachedToFilter)[0];
          const filterValue = (
            operator ? attachedToFilter[operator] || "" : ""
          ).toLowerCase();
          switch (operator) {
            case "contains":
              return displayValue.includes(filterValue);
            case "equals":
              return displayValue === filterValue;
            case "not_equals":
              return displayValue !== filterValue || displayValue === null;
            default:
              return false;
          }
        });
      }

      // 🔷 Sort
      const validSortFields = [
        "attached_to",
        "created_by_name",
        "modified_by_name",
         "effective_start_datetime",
        "effective_end_datetime",
        "status_name",
        "activity_type",
         "r_number",
        "attachment_level",
        "effective_start_datetime",
        "effective_end_datetime",
        "created_datetime",
        "fiscal_year",
        "modified_datetime",
        'subject',
        'task_name',
        
        "call_platform"
      ];
      if(sortBy === 'createdAt') {
        sortBy = 'created_datetime';
      }
      const finalSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_datetime";
      
      const finalSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      allActivities.sort((a, b) => {
        // Special handling for created_datetime
        if (finalSortBy === "created_datetime" ||
            finalSortBy === "effective_start_datetime" || finalSortBy === "effective_end_datetime") {
          const aDate = new Date(a[finalSortBy]).getTime();
          const bDate = new Date(b[finalSortBy]).getTime();
          return finalSortOrder === "ASC" ? aDate - bDate : bDate - aDate;
        }

        let aVal =
          finalSortBy === "attached_to"
            ? displayNames[a.rid] ?? ""
            : a[finalSortBy] ?? "";
        let bVal =
          finalSortBy === "attached_to"
            ? displayNames[b.rid] ?? ""
            : b[finalSortBy] ?? "";

        // Convert to string safely
        aVal =
          typeof aVal === "string"
            ? aVal.toLowerCase()
            : String(aVal).toLowerCase();
        bVal =
          typeof bVal === "string"
            ? bVal.toLowerCase()
            : String(bVal).toLowerCase();

        const aEmpty = !aVal || aVal.trim() === "";
        const bEmpty = !bVal || bVal.trim() === "";

        if (aEmpty && bEmpty) return 0; // Both empty – equal
        if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1; // a empty comes last in ASC, first in DESC
        if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1; // b empty comes last in ASC, first in DESC

        // Both non-empty, normal comparison
        return finalSortOrder === "ASC"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
      const paginatedAttachments = allActivities;

      // 🔷 Map document types and users
      const userIds = [
        ...new Set(
          paginatedAttachments.flatMap((att) => [
            att.created_by,
            att.modified_by,
            att.notes_owner,
          ])
        ),
      ];

      const [users] = await Promise.all([
        userIds.length > 0
          ? this.mainDbSequelize.query(rawQueries.listUsersByIds(userIds), {
              replacements: { userIds },
              type: "SELECT",
            })
          : Promise.resolve([]),
      ]);
      const userMap = new Map(users.map((u: any) => [u.rid, u.full_name]));

      let activities: any[];
      // Enhanced fiscal_year enrichment for all checklist types
      const getFiscalYearForChecklist = async (attachment: any) => {
        // CASE: fetch from Case model
        if (attachment.attachment_level === "case" && attachment.attach_to) {
          const caseData = await this.helperMethod.fetchCaseById(
            accountNumber,
            attachment.attach_to
          );
          return caseData?.fiscal_year ?? null;
        }
        // ACCOUNT: use fiscal_year from checklist model itself
        if (attachment.attachment_level === "account") {
          return attachment.fiscal_year ?? null;
        }
        // PROJECT: fetch from project info (project fiscal_year)
        if (attachment.attachment_level === "project" && attachment.attach_to) {
          const project = await this.helperMethod.fetchProjectInfoById(
            accountNumber,
            attachment.attach_to
          );
          return project?.fiscal_year ?? null;
        }
        // PROJECT_RESOURCE: fetch project_resource, then project fiscal_year
        if (
          attachment.attachment_level === "project_resource" &&
          attachment.attach_to
        ) {
          let projectResource: any =
            await this.helperMethod.fetchProjectResourceById(
              accountNumber,
              attachment.attach_to
            );
          if (Array.isArray(projectResource))
            projectResource = projectResource[0];
          if (projectResource && projectResource.project_fiscal_rid) {
            const project = await this.helperMethod.fetchProjectInfoById(
              accountNumber,
              projectResource.project_fiscal_rid
            );
            return project?.fiscal_year ?? null;
          }
          return null;
        }
        // PROJECT_TASK: fetch project_task, then project fiscal_year
        if (
          attachment.attachment_level === "project_task" &&
          attachment.attach_to
        ) {
          let projectTask: any =
            await this.helperMethod.fetchProjectTaskById(
              accountNumber,
              attachment.attach_to
            );
          if (Array.isArray(projectTask)) projectTask = projectTask[0];
          if (projectTask && projectTask.project_fiscal_rid) {
            const project = await this.helperMethod.fetchProjectInfoById(
              accountNumber,
              projectTask.project_fiscal_rid
            );
            return project?.fiscal_year ?? null;
          }
          return null;
        }

        // Default: fallback to null
        return null;
      };

      activities = await Promise.all(
        paginatedAttachments.map(async (attachment) => {
          const fiscal_year = await getFiscalYearForChecklist(attachment);
          return {
            ...attachment.get({ plain: true }),
              status_name: statusMap.get(attachment.status_rid) || null,
            created_by_name:
              userMap.get(attachment.created_by) || attachment.created_by,
            modified_by_name:
              userMap.get(attachment.modified_by) || attachment.modified_by,
            attached_to: displayNames[attachment.rid] || attachment.attach_to,
            fiscal_year,
            assigned_to_name:
              assignedUserMap.get(attachment.assigned_to) ||
              attachment.assigned_to,
          };
        })
      );
      if (sortBy === "created_by_name") {
        activities.sort((a, b) => {
          const aType = a.created_by_name || "";
          const bType = b.created_by_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }

      if (sortBy === "modified_by_name") {
        activities.sort((a, b) => {
          const aType = a.modified_by_name || "";
          const bType = b.modified_by_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
       if (sortBy === "assigned_to_name") {
        activities.sort((a, b) => {
          const aType = a.assigned_to_name || "";
          const bType = b.assigned_to_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
      if (sortBy === "status_name") {
        activities.sort((a, b) => {
          const aType = a.status_name || "";
          const bType = b.status_name || "";
          const aEmpty = !aType || aType.trim() === "";
          const bEmpty = !bType || bType.trim() === "";

          if (aEmpty && bEmpty) return 0;
          if (aEmpty) return finalSortOrder === "ASC" ? 1 : -1;
          if (bEmpty) return finalSortOrder === "ASC" ? -1 : 1;

          return finalSortOrder === "ASC"
            ? aType.localeCompare(bType)
            : bType.localeCompare(aType);
        });
      }
     function applyActivitiesFilter(array: any[], field: string, filterObj: { [x: string]: any; }) {
    if (!filterObj || typeof filterObj !== 'object' || Array.isArray(filterObj)) return array;
    const operator = Object.keys(filterObj)[0];
    if (!operator) return array;
    let filterValue = "";
    if (operator === "is_empty") filterValue = "";
    else filterValue = (filterObj[operator] ?? "").toString().toLowerCase();
    return array.filter((item) => {
      let value = item[field];
      if (Array.isArray(value)) {
        // For equals: true if any value matches
        // For not_equals: true if none match
        switch (operator) {
          case "equals":
            return value.some((v) => (v ?? "").toString().toLowerCase() === filterValue);
          case "not_equals":
            return !value.some((v) => (v ?? "").toString().toLowerCase() === filterValue);
          case "contains":
            return value.some((v) => (v ?? "").toString().toLowerCase().includes(filterValue));
          case "is_empty":
            return value.length === 0;
          case "in":
            if (!Array.isArray(filterObj[operator])) return false;
            const filterArr = filterObj[operator].map((v: any) => (v ?? "").toString().toLowerCase());
            return value.some((v) => filterArr.includes((v ?? "").toString().toLowerCase()));
          default:
            return false;
        }
      } else {
        value = (value ?? "").toString().toLowerCase();
        switch (operator) {
          case "contains":
            return value.includes(filterValue);
          case "equals":
            return value === filterValue;
          case "not_equals":
            return value !== filterValue;
          case "is_empty":
            return value === "";
          case "in":
            if (!Array.isArray(filterObj[operator])) return false;
            const filterArr = filterObj[operator].map((v: any) => (v ?? "").toString().toLowerCase());
            return filterArr.includes(value);
          default:
            return false;
        }
      }
    });
}

      activities = applyActivitiesFilter(activities, "created_by_name", createdByFilter);
      activities = applyActivitiesFilter(activities, "modified_by_name", modifiedByFilter);
      activities = applyActivitiesFilter(activities, "status_name", statusFilter);
      activities = applyActivitiesFilter(activities, "assigned_to_name", assignedToFilter);
      activities = applyActivitiesFilter(activities, "to_email", toEmailFilter);

      const totalCount = activities.length;
      if (apiType === "download") {
        return {
          activities,
          totalCount,
        };
      }
      activities = activities.slice((page - 1) * limit, page * limit);
      return {
        activities,
        totalCount,
      };
    } catch (err) {
      logMessage(`Error in fetch activities: ${err}`);
      errorLog("Error in fetch activities:", (err as Error).message);
      return [];
    }
  }

   private buildSearchCondition(
      search: string,
      whereClause: Record<string, any>
    ): Record<string, any> {
      const searchCondition = {
        [Op.or]: [
          { case_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
        ],
      };
  
      return Object.keys(whereClause).length > 0
        ? { [Op.and]: [whereClause, searchCondition] }
        : searchCondition;
    }
     buildRawWhereClauseActivities(
        filters: Record<string, any>,
        search?: string
      ): { whereClause: any } {
        const whereClause: any = {
          [Op.and]: []
        };
      
        // Search logic
        if (search) {
          whereClause[Op.and].push({
            [Op.or]: [
              { activity_type: { [Op.iLike]: `%${search}%` } },
              { r_number: { [Op.iLike]: `%${search}%` } },
              { attachment_level : { [Op.iLike]: `%${search}%` } }
            ]
          });
        }
      
        // Filter logic for your input structure
        Object.entries(filters).forEach(([field, filter]) => {
          
          if (!filter || typeof filter !== 'object') {
            return;
          }
          const operator = Object.keys(filter)[0];
          const value = operator ? filter[operator] : undefined;
  
          if (!operator || value === undefined) {
            return;
          }
  
          const condition: any = {};
          
          switch (field) {
            case 'activity_type':
            case 'attachment_level':  
            case 'descriptions':
            case 'attached_to':
            case 'attach_to':
            case 'r_number':
            case 'status_rid':
            case 'assigned_to':
            case 'call_platform':
            case 'subject':
            case 'task_name':
              switch (operator.toLowerCase()) {
                case 'equals': condition[field] = { [Op.iLike]: value }; break;
                case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
                case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
                case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
                case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
              }
              break;
            case 'created_datetime':
            case 'modified_datetime':
            case 'effective_start_datetime':
            case 'effective_end_datetime':
              switch (operator.toLowerCase()) {
                case 'equals': {
                  const date = new Date(value);
                  condition[field] = Sequelize.literal(`DATE("${field}") = DATE('${date.toISOString()}')`);
                  break;
                }
                case 'before': {
                  const date = new Date(value);
                  condition[field] = Sequelize.literal(`DATE("${field}") < DATE('${date.toISOString()}')`);
                  break;
                }
                case 'after': {
                  const date = new Date(value);
                  condition[field] = Sequelize.literal(`DATE("${field}") > DATE('${date.toISOString()}')`);
                  break;
                }
                case 'between': {
                  if (Array.isArray(value)) {
                    const startDate = new Date(value[0]);
                    const endDate = new Date(value[1]);
                    condition[field] = Sequelize.literal(
                      `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                    );
                  }
                  break;
                }
                case 'is_empty': condition[field] = { [Op.is]: null }; break;
              }
              break;
            case 'fiscal_year':  
              switch (operator.toLowerCase()) {
                case 'equals': condition[field] = { [Op.eq]: value }; break;
                case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;          
                case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
                case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
              }
              break;
  
            default:
              logMessage(`Unhandled filter field: ${field}`);
          }
  
          if (Object.keys(condition).length > 0) {
            whereClause[Op.and].push(condition);
          }
        });
      
        return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
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
        attachmentLevel
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
  /**
   * Formats dates for display in error messages
   */
  private formatDateForDisplay(date: Date | string | null): string {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().split("T")[0] || "invalid-date";
  }



  async checkIsActivityTaskUnique(
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
          { activity_type: "Task" },
        ],
      },
    });
    return !response;
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
  async createActivityEmail(
    accountNumber: string,
    activityRequest: IActivityEmail,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities } =
      await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [emailStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchActivityStatusByName(activityRequest.email_status, activityRequest.activity_type),
      { type: "SELECT" }
    );
    let toEmailsArray: string[] = [];
    let ccEmailsArray: string[] = [];
    if (Array.isArray(activityRequest.to_email)) {
    toEmailsArray = activityRequest.to_email;
  } else if (typeof activityRequest.to_email === 'string') {
    try {
      toEmailsArray = JSON.parse(activityRequest.to_email);
    } catch {
      toEmailsArray = [];
    }
  }
   if (Array.isArray(activityRequest.cc_email)) {
    ccEmailsArray = activityRequest.cc_email;
  } else if (typeof activityRequest.cc_email === 'string') {
    try {
      ccEmailsArray = JSON.parse(activityRequest.cc_email);
    } catch {
      ccEmailsArray = [];
    }
  }
    activityRequest.cc_email = ccEmailsArray;
    activityRequest.to_email = toEmailsArray;
    
    const activityData = {
      ...activityRequest,
      activity_type: "Email",
      status_rid: emailStatus?.rid || null,
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };
    const response = await Activities.create(activityData);
    activityRequest.activity_rid = response.rid;
    await this.uploadActivityFiles(files, activityRequest, accountNumber);
    if (activityRequest.email_status === "Sent") {
      activityData.activity_rid = response.rid;
      await this.sendActivityEmail(
        accountNumber,
        activityRequest,
        userId,
        files
      );
    }
    this.addTaskTimeline(
      accountNumber,
      activityData.activity_rid,
      activityData.account_rid,
      `Email Activity Created with subject: ${activityRequest.subject}`,
      userId,
      `Email Activity Created: ${activityRequest.subject}`,
      "success",
      activityData.activity_rid
    );
    return response;
  }

  async updateActivityEmail(
    accountNumber: string,
    activityRequest: any,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities, ActivityAttachments } =
      await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [emailStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchActivityStatusByName(activityRequest.email_status,activityRequest.activity_type),
      { type: "SELECT" }
    );
     let toEmailsArray: string[] = [];
    let ccEmailsArray: string[] = [];
    if (Array.isArray(activityRequest.to_email)) {
    toEmailsArray = activityRequest.to_email;
  } else if (typeof activityRequest.to_email === 'string') {
    try {
      toEmailsArray = JSON.parse(activityRequest.to_email);
    } catch {
      toEmailsArray = [];
    }
  }
   if (Array.isArray(activityRequest.cc_email)) {
    ccEmailsArray = activityRequest.cc_email;
  } else if (typeof activityRequest.cc_email === 'string') {
    try {
      ccEmailsArray = JSON.parse(activityRequest.cc_email);
    } catch {
      ccEmailsArray = [];
    }
  }
    activityRequest.cc_email = ccEmailsArray;
    activityRequest.to_email = toEmailsArray;
    
    const existingActivity = await Activities.findOne({
        where: { rid: activityRequest.activity_rid }
      });
    if (activityRequest.email_status === "Sent") {
      await this.sendActivityEmail(
        accountNumber,
        activityRequest,
        userId,
        files
      );
    }
    const activityData = {
      ...activityRequest,
      activity_type: "Email",
      modified_by: userId,
      modified_datetime: new Date(),
      status_rid: emailStatus?.rid || null,
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };

    const response = await Activities.update(activityData, {
      where: { rid: activityRequest.activity_rid },
    });
    if(activityData.deleted_file_ids !== undefined) {
      if(activityData.deleted_file_ids.length > 0) {
        const getAllDeletedFileIds : any[] = [...new Set(activityData.deleted_file_ids.map((d : any) => d))];
        const findAllDeletedDetails = await ActivityAttachments.findAll({
          attributes : ['rid', 'browse_url'],
          where : {
            rid : {
              [Op.in] : getAllDeletedFileIds
            }
          },
          raw : true
        });
        if(findAllDeletedDetails.length > 0) {
          const mapAttachments = new Map(findAllDeletedDetails.map((f : any) => [f.rid, f.browse_url]));
          let iterationCount = 0
          let totalIteraction = activityData.deleted_file_ids.length;
          for(let id of activityData.deleted_file_ids) {
            await deleteFromAzureBlob(mapAttachments.get(id));
            iterationCount += 1
          }
          if(totalIteraction === iterationCount) {
            await ActivityAttachments.destroy({
              where : {
                rid : {
                  [Op.in] : activityData.deleted_file_ids
                }
              }
            });
          }
        }
      }
    }
    await this.uploadActivityFiles(files, activityRequest, accountNumber);
    await this.addActivityHistory(
        accountNumber,
        activityRequest.activity_rid as string,
        { ...activityRequest, modified_by: userId },
        existingActivity,
       activityTypes.email
     );
    await this.addTaskTimeline(
      accountNumber,
      activityRequest.activity_rid,
      activityRequest.account_rid,
      `Email Activity updated with subject: ${activityRequest.subject}`,
      userId,
      `Email Activity updated: ${activityRequest.subject}`,
      "success",
      activityRequest.activity_rid
    );
    return response;
  }

  async createActivityMeeting(
    accountNumber: string,
    activityRequest: IActivityMeeting,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities } = await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [meetingStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchActivityStatusByName(activityStatus.scheduled, activityRequest.activity_type),
      { type: "SELECT" }
    );
    let meetingParticipants: string[] = [];
    let reOccurenceDays: string[] = [];
     if (Array.isArray(activityRequest.meeting_participants)) {
    meetingParticipants = activityRequest.meeting_participants;
  } else if (typeof activityRequest.meeting_participants === 'string') {
    try {
      meetingParticipants = JSON.parse(activityRequest.meeting_participants);
    } catch {
      meetingParticipants = [];
    }
  }
   if (Array.isArray(activityRequest.recurrence_days)) {
    reOccurenceDays = activityRequest.recurrence_days;
  } else if (typeof activityRequest.recurrence_days === 'string') {
    try {
      reOccurenceDays = JSON.parse(activityRequest.recurrence_days);
    } catch {
      reOccurenceDays = [];
    }
  }
    const activityData = {
      ...activityRequest,
      invited_by: userId,
      activity_type: activityRequest.activity_type,
      effective_start_datetime: activityRequest.effective_start_date,
      effective_end_datetime: activityRequest.effective_end_date,
      status_rid: meetingStatus?.rid || null,
      meeting_participants: meetingParticipants,
      recurrence_days: reOccurenceDays,
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };
    try {
      const [accountInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchAccountInfo(activityRequest.account_rid!),
        { type: "SELECT" }
      );
     let parentAccountNumber = accountNumber;
          if(accountInfo.storage_type === 'separate_db') {
            const [parentAccountInfo]: any[] =
                await this.mainDbSequelize.query(
                rawQueries.fetchAccountInfo(accountInfo.parent_account_rid!),
                { type: "SELECT" }
              );
            parentAccountNumber = parentAccountInfo.r_number;
          }

   const senderEmailInfo = await this.fetchSenderEmailInfoByAccountId(
      parentAccountNumber,
      accountInfo.parent_account_rid
    );
    if(!senderEmailInfo){
      throw new Error("Sender email information not found for scheduling meeting.");
    } 
  
   const [userInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchUserDetails(userId),
        { type: "SELECT" }
      );

    let scheduleResponse =  await scheduleTeamsMeetingUtil(activityData, userInfo.email,senderEmailInfo);
    if(scheduleResponse.success)
    {
      activityData.invited_by = userInfo.email;
      activityData.meeting_invite = scheduleResponse.webLink;
      activityData.meeting_id = scheduleResponse.meetingId;
      activityData.effective_start_datetime = activityData.effective_start_date
      activityData.effective_end_datetime = activityData.effective_end_date
      const response = await Activities.create(activityData);
      activityRequest.activity_rid = response.rid;
      await this.uploadActivityFiles(files, activityRequest, accountNumber);
      await this.addTaskTimeline(
        accountNumber,
        activityData.activity_rid,
        activityData.account_rid,
        `Meeting Activity Created with subject: ${activityRequest.subject}`,
        userId,
        `Meeting Activity Created: ${activityRequest.subject}`,
        "success",
        activityData.activity_rid
      );
      return response;
    }
    else
    {
      return scheduleResponse;
    }
  } catch (err) {
      logMessage(`Error scheduling Teams meeting: ${err}`);
    }    
  }

  async createActivityCall(
    accountNumber: string,
    activityRequest: IActivityCall,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities } =
      await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [callStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchActivityStatusByName(activityStatus.completed, activityRequest.activity_type),
      { type: "SELECT" }
    );
    let callParticipants: string[] = [];
    if (Array.isArray(activityRequest.call_participants)) {
    callParticipants = activityRequest.call_participants;
  } else if (typeof activityRequest.call_participants === 'string') {
    try {
      callParticipants = JSON.parse(activityRequest.call_participants);
    } catch {
      callParticipants = [];
    }
  }
    const activityData = {
      ...activityRequest,
      activity_type: "Call",
      status_rid: callStatus?.rid || null,
      call_participants: callParticipants,
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };
    const response = await Activities.create(activityData);
    activityRequest.activity_rid = response.rid;
    await this.uploadActivityFiles(files, activityRequest, accountNumber);
    this.addTaskTimeline(
      accountNumber,
      activityData.activity_rid,
      activityData.account_rid,
      `Call Activity Created with subject: ${activityRequest.subject}`,
      userId,
      `Call Activity Created: ${activityRequest.subject}`,
      "success",
      activityData.activity_rid
    );
    return response;
  }

   async updateActivityCall(
    accountNumber: string,
    activityRequest: IActivityCall,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities, ActivityAttachments } =
      await this.caseModelService.getModels(accountNumber);
    const activityData = {
      ...activityRequest,
      activity_type: "Call",
      modified_by: userId,
      modified_datetime: new Date(),
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };
    const existingActivity = await Activities.findOne({
        where: { rid: activityRequest.activity_rid }
      });
     let callParticipants: string[] = [];
    if (Array.isArray(activityRequest.call_participants)) {
    callParticipants = activityRequest.call_participants;
  } else if (typeof activityRequest.call_participants === 'string') {
    try {
      callParticipants = JSON.parse(activityRequest.call_participants);
    } catch {
      callParticipants = [];
    }
  }
  activityData.call_participants = callParticipants;

    const response = await Activities.update(activityData, {
      where: { rid: activityRequest.activity_rid },
    });
    if(activityData.deleted_file_ids !== undefined) {
      if(activityData.deleted_file_ids.length > 0) {
        const getAllDeletedFileIds : any[] = [...new Set(activityData.deleted_file_ids.map((d : any) => d))];
        const findAllDeletedDetails = await ActivityAttachments.findAll({
          attributes : ['rid', 'browse_url'],
          where : {
            rid : {
              [Op.in] : getAllDeletedFileIds
            }
          },
          raw : true
        });
        if(findAllDeletedDetails.length > 0) {
          const mapAttachments = new Map(findAllDeletedDetails.map((f : any) => [f.rid, f.browse_url]));
          let iterationCount = 0
          let totalIteraction = activityData.deleted_file_ids.length;
          for(let id of activityData.deleted_file_ids) {
            await deleteFromAzureBlob(mapAttachments.get(id));
            iterationCount += 1
          }
          if(totalIteraction === iterationCount) {
            await ActivityAttachments.destroy({
              where : {
                rid : {
                  [Op.in] : activityData.deleted_file_ids
                }
              }
            });
          }
        }
      }
    }
    await this.uploadActivityFiles(files, activityRequest, accountNumber);
    await this.addActivityHistory(
        accountNumber,
        activityRequest.activity_rid as string,
        { ...activityRequest, modified_by: userId },
        existingActivity,
         activityTypes.call
     );
    await this.addTaskTimeline(
      accountNumber,
      activityRequest.activity_rid,
      activityRequest.account_rid!,
      `Call Activity updated with subject: ${activityRequest.subject}`,
      userId,
      `Call Activity updated: ${activityRequest.subject}`,
      "success",
      activityRequest.activity_rid
    );
    return response;
  }

  async updateActivityMeeting(
    accountNumber: string,
    activityRequest: IActivityMeeting,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    const { Activities, ActivityAttachments } =
      await this.caseModelService.getModels(accountNumber);
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const [meetingStatus]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchActivityStatusByName(activityRequest.meeting_status, activityRequest.activity_type),
      { type: "SELECT" }
    );
      let meetingParticipants: string[] = [];
    let reOccurenceDays: string[] = [];
     if (Array.isArray(activityRequest.meeting_participants)) {
    meetingParticipants = activityRequest.meeting_participants;
  } else if (typeof activityRequest.meeting_participants === 'string') {
    try {
      meetingParticipants = JSON.parse(activityRequest.meeting_participants);
    } catch {
      meetingParticipants = [];
    }
  }
   if (Array.isArray(activityRequest.recurrence_days)) {
    reOccurenceDays = activityRequest.recurrence_days;
  } else if (typeof activityRequest.recurrence_days === 'string') {
    try {
      reOccurenceDays = JSON.parse(activityRequest.recurrence_days);
    } catch {
      reOccurenceDays = [];
    }
  }
    const activityData = {
      ...activityRequest,
      activity_type: "Meeting",
      effective_start_datetime: activityRequest.effective_start_date,
      effective_end_datetime: activityRequest.effective_end_date,
      meeting_status_rid: meetingStatus?.rid || null,
      meeting_participants: meetingParticipants,
      modified_by: userId,
      modified_datetime: new Date(),
      recurrence_days: reOccurenceDays,
      account_rid:
        activityRequest.accountRid || activityRequest.account_rid || "",
    };
    const existingActivity = await Activities.findOne({
        where: { rid: activityRequest.activity_rid },
        raw: true
      });

    const response = await Activities.update(activityData, {
      where: { rid: activityRequest.activity_rid },
    });
    if(activityData.deleted_file_ids !== undefined) {
      if(activityData.deleted_file_ids.length > 0) {
        const getAllDeletedFileIds = [...new Set(activityData.deleted_file_ids.map((d : any) => d))];
        const findAllDeletedDetails = await ActivityAttachments.findAll({
          attributes : ['rid', 'browse_url'],
          where : {
            rid : {
              [Op.in] : getAllDeletedFileIds
            }
          },
          raw : true
        });
        if(findAllDeletedDetails.length > 0) {
          const mapAttachments = new Map(findAllDeletedDetails.map((f : any) => [f.rid, f.browse_url]));
          let iterationCount = 0
          let totalIteraction = activityData.deleted_file_ids.length;
          for(let id of activityData.deleted_file_ids) {
            await deleteFromAzureBlob(mapAttachments.get(id));
            iterationCount += 1
          }
          if(totalIteraction === iterationCount) {
            await ActivityAttachments.destroy({
              where : {
                rid : {
                  [Op.in] : activityData.deleted_file_ids
                }
              }
            });
          }
        }
      }
    }
    await this.uploadActivityFiles(files, activityRequest, accountNumber);
  if(existingActivity != null) {
    const startDate =
      existingActivity.effective_start_datetime !== null
        ? moment.utc(existingActivity.effective_start_datetime).format("YYYY-MM-DD")
        : null;
    const endDate =
      existingActivity.effective_end_datetime !== null
        ? moment.utc(existingActivity.effective_end_datetime).format("YYYY-MM-DD")
        : null;
    await this.addActivityHistory(
      accountNumber,
      activityRequest.activity_rid as string,
      { ...activityData, modified_by: userId },
      {
        ...existingActivity,
        effective_start_datetime: startDate,
        effective_end_datetime: endDate,
      },
      activityTypes.meeting
    );
  }
    await this.addTaskTimeline(
      accountNumber,
      activityRequest.activity_rid,
      activityRequest.account_rid!,
      `Meeting Activity updated with subject: ${activityRequest.subject}`,
      userId,
      `Meeting Activity updated: ${activityRequest.subject}`,
      "success",
      activityRequest.activity_rid
    );
    return response;
  }

  async sendActivityEmail(
    accountNumber: string,
    activityRequest: any,
    userId: string,
    files?: Express.Multer.File[]
  ) {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    const { ActivityAttachments } = await this.caseModelService.getModels(
      accountNumber
    );
    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountInfo(activityRequest.account_rid),
      { type: "SELECT" }
    );
  let parentAccountNumber = accountNumber;
          if(accountInfo.storage_type === 'separate_db') {
            const [parentAccountInfo]: any[] =
                await this.mainDbSequelize.query(
                rawQueries.fetchAccountInfo(accountInfo.parent_account_rid!),
                { type: "SELECT" }
              );
            parentAccountNumber = parentAccountInfo.r_number;
          }
    const senderEmailInfo = await this.fetchSenderEmailInfoByAccountId(
      parentAccountNumber,
      accountInfo.parent_account_rid
    );
    const emailContent = {
      message: {
        subject: activityRequest.subject,
        body: {
          contentType: "HTML",
          content: activityRequest.body_html,
        },
        toRecipients: Array.isArray(activityRequest.to_email)
  ? activityRequest.to_email.map((email: string) => ({
      emailAddress: { address: email }
    }))
  : [{
      emailAddress: { address: activityRequest.to_email }
    }],
        ccRecipients:
          activityRequest.cc_email && activityRequest.cc_email.length > 0
            ? activityRequest.cc_email.map((email: any) => ({
                emailAddress: { address: email },
              }))
            : [],
      },
    };
   
    // Generate attachments array from uploaded files
    let attachments: any[] = Array.isArray(files)
      ? files.map((file) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: file.originalname || file.filename,
          contentBytes: file.buffer.toString("base64"),
          contentType: file.mimetype,
        }))
      : [];

    if (activityRequest.activity_rid) {
      const dbAttachments = await ActivityAttachments.findAll({
        where: {
          activity_rid: activityRequest.activity_rid,
          is_file_deleted: false,
        },
      });
      for (const dbFile of dbAttachments) {
        try {
          const response = await fetch(dbFile.browse_file);
          const buffer = Buffer.from(await response.arrayBuffer());
          attachments.push({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: dbFile.document_name,
            contentBytes: buffer.toString("base64"),
            contentType: dbFile.format || "application/octet-stream",
          });
        } catch (err) {
          logMessage(
            `Error fetching file from blob for email attachment: ${err}`
          );
        }
      }
    }

    let emailResponse = await sendEmailWithAttachment({
      message: emailContent.message,
      attachments,
      senderEmailInfo: senderEmailInfo!,
    });
  }

  async fetchSenderEmailInfoByAccountId(
    accountNumber: string,
    parentAccountId: string
  ) {
    try {
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.caseModelService.getSequelize();
      }
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const [senderEmailInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchSenderEmail(schemaName, parentAccountId)
      );
      const clientSecret = senderEmailInfo[0]?.client_secret;
      const decryptedSecret = await decryptClientSecret(clientSecret);

      return {
        email:
          senderEmailInfo[0]?.support_email,
        clientId:
          senderEmailInfo[0]?.client_id,
        clientSecret:
          decryptedSecret,
        tenantId:
          senderEmailInfo[0]?.tenant_id ,
      };
    } catch (err) {
      logMessage(`Error fetching sender email info for account: ${err}`);
    }
  }

  async deleteEmailAttachment(
    accountNumber: string,
    data: any,
    userId: string
  ) {
    const { ActivityAttachments } = await this.caseModelService.getModels(
      accountNumber
    );
    const checkIsFileExists = await ActivityAttachments.findOne({
      where: {
        rid: data.rid,
        is_file_deleted: false,
      },
    });
    if (checkIsFileExists) {
      await deleteFromAzureBlob(data.url);
      const [updateFile] = await ActivityAttachments.update(
        {
          is_file_deleted: true,
          modified_by: userId,
          modified_datetime: new Date(),
        },
        { where: { rid: data.rid } }
      );
      if (updateFile === 1) {
        await this.addTaskTimeline(
          accountNumber,
          checkIsFileExists.rid,
          data.account_rid,
          `Activity Attachments Deleted : ${checkIsFileExists.document_name}`,
          userId,
          `Attachment deleted for Email  ${data?.rid}`,
          "success",
          data.task_rid
        );

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
  async fetchEmailActivityDetailsById(
    activityRid: string,
    accountNumber: string,
    accountRid: string
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [emailDetails]: any[] = await this.orgDbSequelize.query(
      fetchEmailActivityDetails(schemaName, activityRid),
      { type: "SELECT" }
    );

    if (!emailDetails) {
      throw new Error("Data not found");
    }

    const attachmentsDetails = await this.fetchEmailAttachments(
      accountNumber,
      activityRid
    );

    const userInfo = await this.helperMethod.insertUserDetails(
      emailDetails.created_by ?? "",
      emailDetails.modified_by ?? ""
    );

    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      {
        type: "SELECT",
      }
    );

    const [statusInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.getActivityStatusDetails(emailDetails?.status_rid, emailDetails?.activity_type ?? ""),
      {
        type: "SELECT",
      }
    );
    let attached_to = emailDetails?.attached_to ?? "";
    if (emailDetails?.attach_to === "case") {
      const [caseInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchCaseInfo(accountNumber, accountRid),
        {
          type: "SELECT",
        }
      );
      // Compose case name: accountName-countryCode-fiscalYear-caseName
      const accountName = accountInfo.account_name || "";
      const countryCode = accountInfo.country_code || "";
      const fiscalYear = caseInfo.fiscal_year || "";
      const originalCaseName = caseInfo.case_name || "";
      const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
      attached_to = composedCaseName;
    }

    // Fetch fiscal_year based on attach_to
    let fiscal_year = null;
    const attachTo = emailDetails?.attach_to;
    const attachmentLevel = emailDetails?.attachment_level;
    fiscal_year = await this.getFiscalYearForAttachmentLevel({
      attachmentLevel,
      attachTo,
      schemaName,
      accountNumber,
      emailDetails
    });

    const response: any = {
      attach_to: emailDetails?.attach_to ?? "",
      attachment_level: emailDetails?.attachment_level ?? "",
      attached_to: attached_to ?? "",
      activity_rid: emailDetails?.rid,
      activity_type: emailDetails?.activity_type ?? "",
      subject: emailDetails?.subject ?? "",
      body_html: emailDetails?.body_html ?? "",
      to_email: emailDetails?.to_email || [],
      cc_emails: emailDetails?.cc_email || [],
      r_number: emailDetails.r_number ?? "",
      status_rid: emailDetails.status_rid ?? "",
      account_rid: emailDetails.account_rid ?? "",
      fiscal_year,
      status_name: statusInfo?.status_name ?? "",
      modified_by: userInfo.modified_name ?? emailDetails.modified_by,
      created_by: userInfo.created_name ?? emailDetails.created_by,
      created_datetime: emailDetails.created_datetime ?? null,
      modified_datetime: emailDetails.modified_datetime ?? null,
      attachments: attachmentsDetails || [],
    };

    return response;
  }

  async fetchMeetingActivityDetailsById(
    activityRid: string,
    accountNumber: string,
    accountRid: string
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [emailDetails]: any[] = await this.orgDbSequelize.query(
      fetchActivityDetails(schemaName, activityRid,meetingFields),
      { type: "SELECT" }
    );

    if (!emailDetails) {
      throw new Error("Data not found");
    }

    const attachmentsDetails = await this.fetchEmailAttachments(
      accountNumber,
      activityRid
    );

    const userInfo = await this.helperMethod.insertUserDetails(
      emailDetails.created_by ?? "",
      emailDetails.modified_by ?? ""
    );

    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      {
        type: "SELECT",
      }
    );

    const [statusInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.getActivityStatusDetails(emailDetails?.status_rid ?? "", emailDetails?.activity_type ?? ""),
      {
        type: "SELECT",
      }
    );
    let attached_to = emailDetails?.attached_to ?? "";
    if (emailDetails?.attach_to === "case") {
      const [caseInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchCaseInfo(accountNumber, accountRid),
        {
          type: "SELECT",
        }
      );
      // Compose case name: accountName-countryCode-fiscalYear-caseName
      const accountName = accountInfo.account_name || "";
      const countryCode = accountInfo.country_code || "";
      const fiscalYear = caseInfo.fiscal_year || "";
      const originalCaseName = caseInfo.case_name || "";
      const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
      attached_to = composedCaseName;
    }

    // Fetch fiscal_year based on attach_to
    let fiscal_year = null;
    const attachTo = emailDetails?.attach_to;
    const attachmentLevel = emailDetails?.attachment_level;
    fiscal_year = await this.getFiscalYearForAttachmentLevel({
      attachmentLevel,
      attachTo,
      schemaName,
      accountNumber,
      emailDetails
    });

    const response: any = {
      attach_to: emailDetails?.attach_to ?? "",
      attachment_level: emailDetails?.attachment_level ?? "",
      attached_to: attached_to ?? "",
      activity_rid: emailDetails?.rid,
      activity_type: emailDetails?.activity_type ?? "",
      subject: emailDetails?.subject ?? "",
      meeting_url: emailDetails?.meeting_invite ?? "",
      meeting_id: emailDetails?.meeting_id ?? "",
      meeting_participants: emailDetails?.meeting_participants
        ? emailDetails.meeting_participants
        : [],
      r_number: emailDetails.r_number ?? "",
      status_rid: emailDetails.status_rid ?? "",
      account_rid: emailDetails.account_rid ?? "",
      fiscal_year,
      status_name: statusInfo?.status_name ?? "",
      modified_by: userInfo.modified_name ?? emailDetails.modified_by,
      created_by: userInfo.created_name ?? emailDetails.created_by,
      created_datetime: emailDetails.created_datetime ?? null,
      modified_datetime: emailDetails.modified_datetime ?? null,
      attachments: attachmentsDetails || [],
      effective_start_datetime:emailDetails.effective_start_datetime ?? null,
      effective_end_datetime:emailDetails.effective_end_datetime ?? null, 
      efective_start_time: emailDetails.effective_start_time ?? null,
      efective_end_time: emailDetails.effective_end_time ?? null,
      recurrence_days: emailDetails.recurrence_days ? emailDetails.recurrence_days: [],
      recurrence_interval: emailDetails.recurrence_interval ?? null,
      recurrence_type: emailDetails.recurrence_type ?? null,
      recurrence_day_of_month: emailDetails.recurrence_day_of_month ?? null,
      recurrence_monthly_index: emailDetails.recurrence_monthly_index ?? null,
    };

    return response;
  }

   async fetchCallActivityDetailsById(
    activityRid: string,
    accountNumber: string,
    accountRid: string
  ) {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.caseModelService.getMainSequelize();
    }
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;
    const [emailDetails]: any[] = await this.orgDbSequelize.query(
      fetchActivityDetails(schemaName, activityRid,callFields),
      { type: "SELECT" }
    );

    if (!emailDetails) {
      throw new Error("Data not found");
    }

    const attachmentsDetails = await this.fetchEmailAttachments(
      accountNumber,
      activityRid
    );

    const userInfo = await this.helperMethod.insertUserDetails(
      emailDetails.created_by ?? "",
      emailDetails.modified_by ?? ""
    );

    const [accountInfo]: any[] = await this.mainDbSequelize.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      {
        type: "SELECT",
      }
    );

    const [statusInfo]: any[] = await this.mainDbSequelize.query(
    rawQueries.getActivityStatusDetails(emailDetails?.status_rid ?? "", emailDetails?.activity_type ?? ""),
      {
        type: "SELECT",
      }
    );
    let attached_to = emailDetails?.attached_to ?? "";
    if (emailDetails?.attach_to === "case") {
      const [caseInfo]: any[] = await this.mainDbSequelize.query(
        rawQueries.fetchCaseInfo(accountNumber, accountRid),
        {
          type: "SELECT",
        }
      );
      // Compose case name: accountName-countryCode-fiscalYear-caseName
      const accountName = accountInfo.account_name || "";
      const countryCode = accountInfo.country_code || "";
      const fiscalYear = caseInfo.fiscal_year || "";
      const originalCaseName = caseInfo.case_name || "";
      const composedCaseName = `${accountName}-${countryCode}-${fiscalYear}-${originalCaseName}`;
      attached_to = composedCaseName;
    }

    // Fetch fiscal_year based on attach_to
    let fiscal_year = null;
    const attachTo = emailDetails?.attach_to;
    const attachmentLevel = emailDetails?.attachment_level;
    fiscal_year = await this.getFiscalYearForAttachmentLevel({
      attachmentLevel,
      attachTo,
      schemaName,
      accountNumber,
      emailDetails
    });

    const response: any = {
      attach_to: emailDetails?.attach_to ?? "",
      attachment_level: emailDetails?.attachment_level ?? "",
      attached_to: attached_to ?? "",
      activity_rid: emailDetails?.rid,
      activity_type: emailDetails?.activity_type ?? "",
      subject: emailDetails?.subject ?? "",
      call_participants: emailDetails?.call_participants ? emailDetails.call_participants : [],
      caller_id: emailDetails?.caller_id ?? "",
      minutes_of_meeting: emailDetails?.minutes_of_meeting ?? "",
      call_platform: emailDetails?.call_platform ?? "",
      r_number: emailDetails.r_number ?? "",
      status_rid: emailDetails.status_rid ?? "",
      account_rid: emailDetails.account_rid ?? "",
      fiscal_year,
      status_name: statusInfo?.status_name ?? "",
      modified_by: userInfo.modified_name ?? emailDetails.modified_by,
      created_by: userInfo.created_name ?? emailDetails.created_by,
      created_datetime: emailDetails.created_datetime ?? null,
      modified_datetime: emailDetails.modified_datetime ?? null,
      effective_start_datetime:emailDetails.effective_start_datetime ?? null,
      effective_end_datetime:emailDetails.effective_end_datetime ?? null,
      attachments: attachmentsDetails || [],
    };

    return response;
  }
  async fetchEmailAttachments(accountNumber: string, activityId: string) {
    try {
      const { ActivityAttachments } = await this.caseModelService.getModels(
        accountNumber
      );
      // Convert Sequelize instances to plain objects

      const items = await ActivityAttachments.findAll({
        order: [["created_datetime", "ASC"]],
        where: { activity_rid: activityId },
        raw: true,
      });
      const updatedAttachments = await Promise.all(
        (items || []).map(async (da: any) => ({
          ...da,
          browse_file: da.browse_file
            ? await generateSasUrl(da.browse_file)
            : null,
        }))
      );
      return updatedAttachments;
    } catch (err) {
      logMessage(`Error fetching email attachments: ${err}`);
      throw new Error(
        "Error fetching email attachments: " + (err as Error).message
      );
    }
  }

   async getActivityStatus(activityType:string) {
      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.caseModelService.getMainSequelize();
      }
      const activityStatus = await this.mainDbSequelize.query(
        rawQueries.getActivityStatus(activityType),
        {
          type: "SELECT",
        }
      );
  
      return activityStatus;
    }
  /**
   * Reusable function to fetch fiscal_year based on attachment level and attachTo
   */
  private async getFiscalYearForAttachmentLevel({
    attachmentLevel,
    attachTo,
    schemaName,
    accountNumber,
    emailDetails
  }: {
    attachmentLevel: string;
    attachTo: any;
    schemaName: string;
    accountNumber: string;
    emailDetails?: any;
  }): Promise<number | null> {
    if(!this.orgDbSequelize) {
      this.orgDbSequelize = await this.caseModelService.getSequelize();
    }
    if (attachmentLevel === "case" && attachTo) {
      const [caseInfo]: any[] = await this.orgDbSequelize.query(
        rawQueries.fetchCaseInfo(schemaName, attachTo),
        { type: "SELECT" }
      );
      return caseInfo?.fiscal_year ?? null;
    } else if (attachmentLevel === "account" && attachTo) {
      return emailDetails?.fiscal_year ?? null;
    } else if (attachmentLevel === "project" && attachTo) {
      const project = await this.helperMethod.fetchProjectInfoById(
        accountNumber,
        attachTo
      );
      return project?.fiscal_year ?? null;
    } else if (attachmentLevel === "project_resource" && attachTo) {
      let projectResource: any =
        await this.helperMethod.fetchProjectResourceById(
          schemaName,
          attachTo
        );
      if (Array.isArray(projectResource)) projectResource = projectResource[0];
      if (projectResource && projectResource.project_fiscal_rid) {
        const project = await this.helperMethod.fetchProjectInfoById(
          accountNumber,
          projectResource.project_fiscal_rid
        );
        return project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === "project_task" && attachTo) {
      let projectTask: any = await this.helperMethod.fetchProjectTaskById(
        accountNumber,
        attachTo
      );
      if (Array.isArray(projectTask)) projectTask = projectTask[0];
      if (projectTask && projectTask.project_fiscal_rid) {
        const project = await this.helperMethod.fetchProjectInfoById(
          accountNumber,
          projectTask.project_fiscal_rid
        );
        return project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === "resource" && attachTo) {
      let resource: any = await this.helperMethod.fetchResourceById(
        accountNumber,
        attachTo
      );
      if (Array.isArray(resource)) resource = resource[0];
      if (resource && resource.project_fiscal_rid) {
        const project = await this.helperMethod.fetchProjectInfoById(
          accountNumber,
          resource.project_fiscal_rid
        );
        return project?.fiscal_year ?? null;
      }
    } else if (attachmentLevel === "resource_cost" && attachTo) {
      let resourceCost: any =
        await this.helperMethod.fetchResourceCostById(
          accountNumber,
          attachTo
        );
      if (Array.isArray(resourceCost)) resourceCost = resourceCost[0];
      if (resourceCost && resourceCost.resource_rid) {
        let resource: any = await this.helperMethod.fetchResourceById(
          accountNumber,
          resourceCost.resource_rid
        );
        if (Array.isArray(resource)) resource = resource[0];
        if (resource && resource.project_fiscal_rid) {
          const project = await this.helperMethod.fetchProjectInfoById(
            accountNumber,
            resource.project_fiscal_rid
          );
          return project?.fiscal_year ?? null;
        }
      }
    } else if (attachmentLevel === "resource_skill" && attachTo) {
      let resourceSkill: any =
        await this.helperMethod.fetchResourceSkillById(
          accountNumber,
          attachTo
        );
      if (Array.isArray(resourceSkill)) resourceSkill = resourceSkill[0];
      if (resourceSkill && resourceSkill.resource_rid) {
        let resource: any = await this.helperMethod.fetchResourceById(
          accountNumber,
          resourceSkill.resource_rid
        );
        if (Array.isArray(resource)) resource = resource[0];
        if (resource && resource.project_fiscal_rid) {
          const project = await this.helperMethod.fetchProjectInfoById(
            accountNumber,
            resource.project_fiscal_rid
          );
          return project?.fiscal_year ?? null;
        }
      }
    }
    return null;
  }

   async addActivityHistory(
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
        ];
  
        const cleanedNewData = Object.fromEntries(
          Object.entries(newCaseData).filter(
            ([key]) => !excludedFields.includes(key)
          )
        );
  
        const historyChanges = Object.entries(cleanedNewData)
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
  
            return String(newValue ?? "") !== String(oldValue ?? "");
          })
          .map(([key, newValue]) => ({
            account_rid: newCaseData["account_rid"],
            activity_rid: activityId,
            attribute_name: key,
            old_value:
              existingCaseData[key] !== null &&
              existingCaseData[key] !== undefined
                ? String(existingCaseData[key])
                : "",
            new_value:
              newValue !== null && newValue !== undefined ? String(newValue) : "",
            created_by: newCaseData["modified_by"],
            activity_type: activityType || newCaseData["activity_type"] || "",
          }));
  
        if (historyChanges.length === 0) return;

  
        // Use individual create operations to avoid sequence conflicts
        for (const historyChange of historyChanges) {
          await ActivityHistory.create(historyChange);
        }
      } catch (err) {
        logMessage(`Error updating activity history : ${JSON.stringify(err)}`);
        errorLog("Error updating activity history : " + (err as Error).message);
        throw new Error(
          "Error updating activity history : " + (err as Error).message
        );
      }
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
          "tags",
          "task_description"
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
            if(!this.mainDbSequelize) {
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
            if(!this.mainDbSequelize) {
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
            if(!this.mainDbSequelize) {
              this.mainDbSequelize = await this.caseModelService.getMainSequelize();
            }
            // Assuming rawQueries.fetchPriorityNames returns [{ rid, name }]
            const result = await this.mainDbSequelize.query(rawQueries.fetchPriority(String(oldValue || ''), String(newValue || '')));
            for (let r of result[0]) {
              priorityMapping.set((r as any)?.rid, (r as any)?.priority_name);
            }
            priorityOldValueString = priorityMapping.get(oldValue);
            priorityNewValueString = priorityMapping.get(newValue);
          }
        }

         // Prepare mapping for checklist_rid values
        const checklistMapping = new Map();
        let checklistOldValueString = null;
        let checklistNewValueString = null;
        if (cleanedNewData.hasOwnProperty('checklist_rid')) {
          const oldValue = existingCaseData['checklist_rid'];
          const newValue = cleanedNewData['checklist_rid'];
          if (oldValue || newValue) {
            if(!this.mainDbSequelize) {
              this.mainDbSequelize = await this.caseModelService.getMainSequelize();
            }
            // Assuming rawQueries.fetchPriorityNames returns [{ rid, name }]
            const result = await this.mainDbSequelize.query(rawQueries.fetchCheckLists(String(oldValue || ''), String(newValue || '')));
            for (let r of result[0]) {
              checklistMapping.set((r as any)?.rid, (r as any)?.checklist_name);
            }
            checklistOldValueString = checklistMapping.get(oldValue);
            checklistNewValueString = checklistMapping.get(newValue);
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
            if( key === "checklist_rid") {
              return checklistOldValueString !== checklistNewValueString;
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
            else if (key === "checklist_rid") {
              mappedKey = "CheckList";
              oldValueStr = checklistOldValueString ?? oldValueStr;
              newValueStr = checklistNewValueString ?? newValueStr;
            }
            else if (key === 'task_name') {
              mappedKey = "Task Name"
            } else if (key === 'task_description' || key === 'description') {
              mappedKey = "Task Description";
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
}
export default ActivitySchemaService;
