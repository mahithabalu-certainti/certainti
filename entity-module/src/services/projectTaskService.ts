import moment, { Moment } from "moment";
import "moment-timezone";  
import { initOrgSequelize } from "../config/orgDataSource";
import { HttpStatus, MAIN_SCHEMA_NAME, rawQueries } from "../utils/constants";
import { Op, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import SchemaService from "./schemaService";
import { Logger } from "winston";

import ProjectIngestionService from "./projectIngestionService";
import { ResourceService } from "./resourceServices";
import { ProjectTask } from "../models/projectTask";
import AccountDetails from "../models/accountDetails";
import { Project } from "../models/project";
import { Resources } from "../models/resource";
import { ProjectFiscal } from "../models/projectFiscal";


export class ProjectTaskService {
    private schemaService: SchemaService;
    private projectIngestionService: ProjectIngestionService;
    private resourceService: ResourceService;
    private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.schemaService = new SchemaService();
    this.projectIngestionService = new ProjectIngestionService(logger);
    this.resourceService = new ResourceService();
  }

async listProjectTasks(
  accountRid: string,
  projectRid: string,
  projectResourceRid: string,
  filters: Record<string, any> = {},
  search?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'created_datetime',
  sortOrder: string = 'DESC'
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { tasks: any[]; totalCount: number };
}> {
  try {
    const sequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

    const accountData = await this.schemaService.fetchAccountById(accountRid);
    if (!accountData) throw new Error("Invalid account ID");

    let schemaNumber = accountData.r_number;
    if (accountData.storage_type === "store_in_parent") {
      schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
    }

    const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, '')}`;

    // ✅ Initialize all models first
    const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const ResourceModel = Resources.initialize(sequelize, schemaName);
    const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

    // ✅ Define associations after initialization
    ProjectTaskModel.belongsTo(AccountDetailsModel, {
      foreignKey: 'account_rid',
      targetKey: 'account_rid',
      as: 'account'
    });

    ProjectTaskModel.belongsTo(ProjectFiscalModel, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project'
    });

    ProjectTaskModel.belongsTo(ResourceModel, {
      foreignKey: 'resource_rid',
      targetKey: 'rid',
      as: 'resource'
    });

    // ✅ Build where clause with project filter
    const { whereClause } = this.buildRawWhereClause(filters, search);
    whereClause[Op.and] = whereClause[Op.and] || [];
    whereClause[Op.and].push({ project_rid: projectRid });
    if (projectResourceRid) {
      whereClause[Op.and].push({ project_resource_rid: projectResourceRid });
    }

    // ✅ Get all tasks without pagination first to properly handle sorting of related data
    const allTasks = await ProjectTaskModel.findAll({
      where: whereClause,
      include: [
        {
          model: AccountDetailsModel,
          attributes: ['account_name'],
          required: false,
          as: 'account'
        },
        {
          model: ProjectFiscalModel,
          attributes: ['project_name', 'project_code'],
          required: false,
          as: 'project'
        },
        {
          model: ResourceModel,
          attributes: ['resource_code','resource_name','resource_type_rid','resource_role','resource_orgname'],
          required: false,
          as: 'resource'
        }
      ]
    });

    // ✅ Fetch and map related data
    const resourceTypeRids = allTasks.map(task => (task as any)?.resource.resource_type_rid).filter(rid => rid);
    const resourceTypes = resourceTypeRids.length
      ? await mainSequelize.query(
        `SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRids)`,
        { replacements: { resourceTypeRids }, type: 'SELECT' }
      )
      : [];
    const resourceTypeMap = new Map(resourceTypes.map((type: any) => [type.rid, type.resource_type_name]));

    const regionRids = allTasks.map(task => task.region_rid).filter(rid => rid);
    const countryRids = allTasks.map(task => task.country_rid).filter(rid => rid);

    const [regions, countries] = await Promise.all([
      regionRids.length
        ? mainSequelize.query(
          `SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:regionRids)`,
          { replacements: { regionRids }, type: 'SELECT' }
        )
        : [],
      countryRids.length
        ? mainSequelize.query(
          `SELECT rid, country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid IN (:countryRids)`,
          { replacements: { countryRids }, type: 'SELECT' }
        )
        : []
    ]);

    const regionMap = new Map(regions.map((region: any) => [region.rid, region.state_name]));
    const countryMap = new Map(countries.map((country: any) => [country.rid, country.country_name]));

    // ✅ Format all tasks
    let formattedTasks = allTasks.map(task => ({
      rid: task.rid,
      r_number: task.r_number,
      account_rid: task.account_rid,
      account_name: (task as any).account?.account_name || null,
      project_rid: task.project_rid,
      project_name: (task as any).project?.project_name || null,
      project_code: (task as any).project?.project_code || null,
      project_resource_code: task.project_resource_code,
      resource_rid: task.resource_rid,
      resource_code: (task as any).resource?.resource_code || null,
      fiscal_year: task.fiscal_year,
      start_date: task.start_date,
      end_date: task.end_date,
      resource_name: (task as any).resource?.resource_name || null,
      resource_type_rid: (task as any).resource?.resource_type_rid || null,
      resource_type_name: resourceTypeMap.get((task as any).resource?.resource_type_rid) || null, // FIXED
      resource_role: (task as any).resource?.resource_role || null,
      status_rid: task.status_rid,
      country_rid: task.country_rid,
      country_name: countryMap.get(task.country_rid) || null,
      region_rid: task.region_rid,
      region_name: regionMap.get(task.region_rid) || null,
      currency_rid: task.currency_rid,
      resource_orgname: (task as any).resource?.resource_orgname || null,
      effort_project_task_level: task.effort_project_task_level,
      cost_project_task_level: task.cost_project_task_level,
      description: task.description,
      comments: task.comments,
      created_by: task.created_by,
      modified_by: task.modified_by, 
      created_datetime: task.created_datetime,
      modified_datetime: task.modified_datetime
    }));

    // ✅ Handle special sorting cases
    const validSortFields = ['resource_code', 'r_number', 'resource_name', 'resource_type', 'resource_role', 'start_date', 'cost_project_task_level', 'effort_project_task_level', 'description', 'comments', 'region', 'country', 'created_datetime', 'modified_datetime'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Sort based on the mapped names for special fields
    if (finalSortBy === 'resource_type') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_type_name;
        const bName = b.resource_type_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'region') {
      formattedTasks.sort((a, b) => {
        const aName = a.region_name;
        const bName = b.region_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'country') {
      formattedTasks.sort((a, b) => {
        const aName = a.country_name;
        const bName = b.country_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'resource_code') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_code;
        const bName = b.resource_code;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'resource_name') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_name;
        const bName = b.resource_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'project_code') {
      formattedTasks.sort((a, b) => {
        const aName = a.project_code;
        const bName = b.project_code;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'project_name') {
      formattedTasks.sort((a, b) => {
        const aName = a.project_name;
        const bName = b.project_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else {
      formattedTasks.sort((a, b) => {
        const aVal = a[finalSortBy as keyof typeof a];
        const bVal = b[finalSortBy as keyof typeof b];
        if (finalSortOrder === 'ASC') {
          if (!aVal) return -1;
          if (!bVal) return 1;
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          if (!aVal) return 1;
          if (!bVal) return -1;
          return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
        }
      });
    }

    // ✅ Apply pagination after sorting
    const total = formattedTasks.length;
    formattedTasks = formattedTasks.slice((page - 1) * limit, page * limit);

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        tasks: formattedTasks,
        totalCount: total
      }
    };

  } catch (error) {
    this.logger.error('Error in listProjectTasks:', error);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachments',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { tasks: [], totalCount: 0 }
    };
  }
}


async listProjectTasksExport(
  userId: string,
  accountRid: string,
  projectRid: string,
  projectResourceRid: string,
  filters: Record<string, any> = {},
  search?: string,
  sortBy: string = 'created_datetime',
  sortOrder: string = 'DESC'
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { tasks: any[]; totalCount: number };
}> {
  try {
    const sequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

    const accountData = await this.schemaService.fetchAccountById(accountRid);
    if (!accountData) throw new Error("Invalid account ID");

    let schemaNumber = accountData.r_number;
    if (accountData.storage_type === "store_in_parent") {
      schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
    }

    const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, '')}`;

    // ✅ Initialize all models first
    const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const ResourceModel = Resources.initialize(sequelize, schemaName);
    const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

    // ✅ Define associations after initialization
    ProjectTaskModel.belongsTo(AccountDetailsModel, {
      foreignKey: 'account_rid',
      targetKey: 'account_rid',
      as: 'account'
    });

    ProjectTaskModel.belongsTo(ProjectFiscalModel, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project'
    });

    ProjectTaskModel.belongsTo(ResourceModel, {
      foreignKey: 'resource_rid',
      targetKey: 'rid',
      as: 'resource'
    });

    // ✅ Build where clause with project filter
    const { whereClause } = this.buildRawWhereClause(filters, search);
    whereClause[Op.and] = whereClause[Op.and] || [];
    whereClause[Op.and].push({ project_rid: projectRid });
    if (projectResourceRid) {
      whereClause[Op.and].push({ project_resource_rid: projectResourceRid });
    }

    // ✅ Get all tasks without pagination first to properly handle sorting of related data
    const allTasks = await ProjectTaskModel.findAll({
      where: whereClause,
      include: [
        {
          model: AccountDetailsModel,
          attributes: ['account_name'],
          required: false,
          as: 'account'
        },
        {
          model: ProjectFiscalModel,
          attributes: ['project_name', 'project_code'],
          required: false,
          as: 'project'
        },
        {
          model: ResourceModel,
          attributes: ['resource_code','resource_name','resource_type_rid','resource_role','resource_orgname'],
          required: false,
          as: 'resource'
        }
      ]
    });

    // ✅ Fetch and map related data
    const resourceTypeRids = allTasks.map(task => (task as any)?.resource.resource_type_rid).filter(rid => rid);
    const resourceTypes = resourceTypeRids.length
      ? await mainSequelize.query(
        `SELECT rid, resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid IN (:resourceTypeRids)`,
        { replacements: { resourceTypeRids }, type: 'SELECT' }
      )
      : [];
    const resourceTypeMap = new Map(resourceTypes.map((type: any) => [type.rid, type.resource_type_name]));

    const regionRids = allTasks.map(task => task.region_rid).filter(rid => rid);
    const countryRids = allTasks.map(task => task.country_rid).filter(rid => rid);

    const [regions, countries] = await Promise.all([
      regionRids.length
        ? mainSequelize.query(
          `SELECT rid, state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid IN (:regionRids)`,
          { replacements: { regionRids }, type: 'SELECT' }
        )
        : [],
      countryRids.length
        ? mainSequelize.query(
          `SELECT rid, country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid IN (:countryRids)`,
          { replacements: { countryRids }, type: 'SELECT' }
        )
        : []
    ]);

    const regionMap = new Map(regions.map((region: any) => [region.rid, region.state_name]));
    const countryMap = new Map(countries.map((country: any) => [country.rid, country.country_name]));

    // ✅ Format all tasks
    let formattedTasks = allTasks.map(task => ({
      rid: task.rid,
      r_number: task.r_number,
      account_rid: task.account_rid,
      account_name: (task as any).account?.account_name || null,
      project_rid: task.project_rid,
      project_name: (task as any).project?.project_name || null,
      project_code: (task as any).project?.project_code || null,
      project_resource_code: task.project_resource_code,
      resource_rid: task.resource_rid,
      resource_code: (task as any).resource?.resource_code || null,
      fiscal_year: task.fiscal_year,
      start_date: task.start_date,
      end_date: task.end_date,
      resource_name: (task as any).resource?.resource_name || null,
      resource_type_rid: (task as any).resource?.resource_type_rid || null,
      resource_type_name: resourceTypeMap.get((task as any).resource?.resource_type_rid) || null, // FIXED
      resource_role: (task as any).resource?.resource_role || null,
      status_rid: task.status_rid,
      country_rid: task.country_rid,
      country_name: countryMap.get(task.country_rid) || null,
      region_rid: task.region_rid,
      region_name: regionMap.get(task.region_rid) || null,
      currency_rid: task.currency_rid,
      resource_orgname: (task as any).resource?.resource_orgname || null,
      effort_project_task_level: task.effort_project_task_level,
      cost_project_task_level: task.cost_project_task_level,
      description: task.description,
      comments: task.comments,
      created_by: task.created_by,
      modified_by: task.modified_by, 
      created_datetime: task.created_datetime,
      modified_datetime: task.modified_datetime
    }));

    // ✅ Handle special sorting cases
    const validSortFields = ['resource_code', 'r_number', 'resource_name', 'resource_type', 'resource_role', 'start_date', 'cost_project_task_level', 'effort_project_task_level', 'description', 'comments', 'region', 'country', 'created_datetime', 'modified_datetime'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_datetime';
    const finalSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Sort based on the mapped names for special fields
    if (finalSortBy === 'resource_type') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_type_name;
        const bName = b.resource_type_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'region') {
      formattedTasks.sort((a, b) => {
        const aName = a.region_name;
        const bName = b.region_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'country') {
      formattedTasks.sort((a, b) => {
        const aName = a.country_name;
        const bName = b.country_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'resource_code') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_code;
        const bName = b.resource_code;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'resource_name') {
      formattedTasks.sort((a, b) => {
        const aName = a.resource_name;
        const bName = b.resource_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'project_code') {
      formattedTasks.sort((a, b) => {
        const aName = a.project_code;
        const bName = b.project_code;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else if (finalSortBy === 'project_name') {
      formattedTasks.sort((a, b) => {
        const aName = a.project_name;
        const bName = b.project_name;
        if (finalSortOrder === 'ASC') {
          if (!aName) return -1;
          if (!bName) return 1;
          return aName.localeCompare(bName);
        } else {
          if (!aName) return 1;
          if (!bName) return -1;
          return bName.localeCompare(aName);
        }
      });
    } else {
      formattedTasks.sort((a, b) => {
        const aVal = a[finalSortBy as keyof typeof a];
        const bVal = b[finalSortBy as keyof typeof b];
        if (finalSortOrder === 'ASC') {
          if (!aVal) return -1;
          if (!bVal) return 1;
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          if (!aVal) return 1;
          if (!bVal) return -1;
          return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
        }
      });
    }

    // ✅ Apply pagination after sorting
    const total = formattedTasks.length;

    const [
        projectTaskFields
      ] = await Promise.all([
        this.schemaService.getAllowedExportFields(userId, "projects_task_view_edit")
      ]);

        const allowedFieldSet = new Set<string>();
        for (const field of projectTaskFields) {
          if (field.read) {
            allowedFieldSet.add(field.field_name);
          }
        }

      const labelMap: Record<string, string> = {
        "account_name": "Account Name",
        "project_code": "Project Code",
        "project_name": "Project Name",
        "resource_code": "Resource Code",
        "resource_name": "Resource Name",
        "fiscal_year": "Fiscal Year",
        "resource_type_name": "Resource Type",
        "resource_role": "Role",
        "start_date": "Task Date",
        "cost_project_task_level": "Cost",
        "effort_project_task_level": "Effort in Hrs",
        "description": "Task Description",
        "comments": "Comments",
        "region_name": "Region",
        "country_name": "Country",
        "r_number": "Task ID"
};
      const fieldValueMap: Record<string, string> = {
        "resource_type_rid": "resource_type_name",
        "region_rid":"region_name",
        "country_rid":"country_name",
        "resource_rid": "resource_name",
        "account_rid": "account_name",
        "project_rid": "project_name"
      };

      const exportData = formattedTasks.map((task: any) => {
      const row: Record<string, string> = {};

      for (const [field, label] of Object.entries(labelMap)) {
       if (allowedFieldSet.has(field)) {
      const actualField = fieldValueMap[field] || field; // fallback to same field if not mapped
      row[label] = task[actualField] ?? "-";
      }
      }

      return row;
    });
     
    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        tasks: exportData,
        totalCount: total
      }
    };

  } catch (error) {
    this.logger.error('Error in listProjectTasks:', error);
    return {
      statusCode: 500,
      message: 'Failed to fetch attachments',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      data: { tasks: [], totalCount: 0 }
    };
  }
}

async getProjectTaskById(
  accountRid: string,
  taskRid: string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: any;
}> {
  try {
    const sequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

    const accountData = await this.schemaService.fetchAccountById(accountRid);
    if (!accountData) throw new Error("Invalid account ID");

    let schemaNumber = accountData.r_number;
    if (accountData.storage_type === "store_in_parent") {
      schemaNumber = await this.schemaService.fetchParentAccount(accountData.parent_account_rid);
    }

    const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, '')}`;

    // Initialize models
    const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const ResourceModel = Resources.initialize(sequelize, schemaName);
    const ProjectTaskModel = ProjectTask.initialize(sequelize, schemaName);

    // Define associations
    ProjectTaskModel.belongsTo(AccountDetailsModel, {
      foreignKey: 'account_rid',
      targetKey: 'account_rid',
      as: 'account'
    });

    ProjectTaskModel.belongsTo(ProjectFiscalModel, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project'
    });

    ProjectTaskModel.belongsTo(ResourceModel, {
      foreignKey: 'resource_rid',
      targetKey: 'rid',
      as: 'resource'
    });

    const task = await ProjectTaskModel.findOne({
      where: { rid: taskRid },
      include: [
        {
          model: AccountDetailsModel,
          attributes: ['account_name'],
          required: false,
          as: 'account'
        },
        {
          model: ProjectFiscalModel,
          attributes: ['project_name', 'project_code'],
          required: false,
          as: 'project'
        },
        {
          model: ResourceModel,
          attributes: ['resource_code','resource_type_rid', 'resource_name', 'resource_role', 'resource_orgname'],
          required: false,
          as: 'resource'
        }
      ]
    });

    if (!task) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: "Task not found",
        errorMessage: "The requested task could not be found"
      };
    }

    const [resourceTypeData, regionData, countryData] = await Promise.all([
      (task as any).resource?.resource_type_rid ? mainSequelize.query(
        `SELECT resource_type_name FROM ${MAIN_SCHEMA_NAME}.resource_type WHERE rid = :resourceTypeRid`,
        { 
          replacements: { resourceTypeRid: (task as any).resource?.resource_type_rid },
          type: 'SELECT'
        }
      ) : Promise.resolve([]),

      task.region_rid ? mainSequelize.query(
        `SELECT state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = :regionRid`,
        {
          replacements: { regionRid: task.region_rid },
          type: 'SELECT'
        }
      ) : Promise.resolve([]),

      task.country_rid ? mainSequelize.query(
        `SELECT country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = :countryRid`,
        {
          replacements: { countryRid: task.country_rid },
          type: 'SELECT'
        }
      ) : Promise.resolve([])
    ]);

    const [resourceType] = resourceTypeData;
    const [region] = regionData;
    const [country] = countryData;

    const attachments = await this.fetchAttachmentsBytaskId(taskRid);
    let mappedAttachments = [];
    
    if(attachments.length > 0) {
      const documentTypeIds = [...new Set(attachments.map(attachment => attachment.document_type_rid))];
      const documentCategoryIds = [...new Set(attachments.map(attachment => attachment.document_category_rid))];
      const userIds = [...new Set(attachments.map(attachment => attachment.created_by))];

      const [documentTypes, documentCategories, users] = await Promise.all([
        documentTypeIds.length > 0 
          ? mainSequelize.query(rawQueries.GET_DOCUMENT_TYPES, { 
              replacements: { documentTypeIds }, 
              type: 'SELECT' 
            })
          : Promise.resolve([]),

        documentCategoryIds.length > 0
          ? mainSequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
              replacements: { documentCategoryIds },
              type: 'SELECT'
            })
          : Promise.resolve([]),

        userIds.length > 0
          ? mainSequelize.query(rawQueries.GET_USERS, {
              replacements: { userIds },
              type: 'SELECT'
            })
          : Promise.resolve([])
      ]);

      mappedAttachments = attachments.map(attachment => ({
        ...attachment,
        document_type: (documentTypes.find((dt: any) => dt.rid === attachment.document_type_rid) as { type_name: string })?.type_name || '',
        document_category: (documentCategories.find((dc: any) => dc.rid === attachment.document_category_rid) as { category_name: string })?.category_name || '',
        uploaded_by: (users.find((u: any) => u.rid === attachment.created_by) as {full_name: string})?.full_name || '',
        attached_to: task.r_number
      }));
    }

    const taskWithUserDetails = await this.insertUserDetails(task);

    const formattedTask = {
      rid: taskWithUserDetails.dataValues.rid,
      r_number: taskWithUserDetails.dataValues.r_number,
      account_rid: taskWithUserDetails.dataValues.account_rid,
      account_name: taskWithUserDetails.dataValues.account?.account_name || null,
      project_rid: taskWithUserDetails.dataValues.project_rid,
      project_name: taskWithUserDetails.dataValues.project?.project_name || null,
      project_code: taskWithUserDetails.dataValues.project?.project_code || null,
      project_resource_rid: taskWithUserDetails.dataValues.project_resource_rid,
      resource_rid: taskWithUserDetails.dataValues.resource_rid,
      resource_code: taskWithUserDetails.dataValues.resource?.resource_code || null,
      fiscal_year: taskWithUserDetails.dataValues.fiscal_year,
      start_date: taskWithUserDetails.dataValues.start_date,
      end_date: taskWithUserDetails.dataValues.end_date,
      resource_name: taskWithUserDetails.dataValues.resource?.resource_name,
      resource_type_rid: taskWithUserDetails.dataValues.resource?.resource_type_rid,
      resource_type_name: (resourceType as any)?.resource_type_name || null,
      resource_role: taskWithUserDetails.dataValues.resource?.resource_role,
      status_rid: taskWithUserDetails.dataValues.status_rid,
      country_rid: taskWithUserDetails.dataValues.country_rid,
      country_name: (country as any)?.country_name || null,
      region_rid: taskWithUserDetails.dataValues.region_rid,
      region_name: (region as any)?.state_name || null,
      currency_rid: taskWithUserDetails.dataValues.currency_rid,
      resource_orgname: taskWithUserDetails.dataValues.resource?.resource_orgname,
      effort_project_task_level: taskWithUserDetails.dataValues.effort_project_task_level,
      cost_project_task_level: taskWithUserDetails.dataValues.cost_project_task_level,
      description: taskWithUserDetails.dataValues.description,
      comments: taskWithUserDetails.dataValues.comments,
      attachment: mappedAttachments,
      created_datetime: taskWithUserDetails.dataValues.created_datetime,
      modified_datetime: taskWithUserDetails.dataValues.modified_datetime,
      created_by: taskWithUserDetails.created_name,
      modified_by: taskWithUserDetails.modified_name,
    };
  
    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: formattedTask
    };

  } catch (error) {
    this.logger.error('Error in getProjectTaskById:', error);
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

private buildRawWhereClause(
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
        { resource_name: { [Op.iLike]: `%${search}%` } },
        { r_number: { [Op.iLike]: `%${search}%` } },
        { comments: { [Op.iLike]: `%${search}%` } }
      ]
    });
  }

  // Filter logic for your input structure
  Object.entries(filters).forEach(([field, filter]) => {
    if (!filter || typeof filter !== 'object') {
      console.log(`Skipping filter for field ${field} due to invalid structure`);
      return;
    }

    const operator = Object.keys(filter)[0];
    const value = filter[operator];

    if (!operator || value === undefined) {
      console.log(`Skipping filter for field ${field} due to missing operator or value`);
      return;
    }

    const condition: any = {};

    switch (field) {
      case 'cost_project_task_level':
      case 'effort_project_task_level':  
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.eq]: Number(value) }; break;
          case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }] }; break;
          case 'less_than': condition[field] = { [Op.lt]: Number(value) }; break;
          case 'greater_than': condition[field] = { [Op.gt]: Number(value) }; break;
          case 'between':
            if (Array.isArray(value)) {
              condition[field] = { [Op.between]: [Number(value[0]), Number(value[1])] };
            }
            break;
          case 'is_empty':
            condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }] };
            break;
        }
        break;

      case 'resource_code':
        switch (operator.toLowerCase()) {
          case 'equals': condition['$resource.resource_code$'] = { [Op.iLike]: value }; break;
          case 'not_equals': condition['$resource.resource_code$'] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
          case 'contains': condition['$resource.resource_code$'] = { [Op.iLike]: `%${value}%` }; break;
          case 'is_empty': condition['$resource.resource_code$'] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;
      case 'resource_role':
        switch (operator.toLowerCase()) {
          case 'equals': condition['$resource.resource_role$'] = { [Op.iLike]: value }; break;
          case 'not_equals': condition['$resource.resource_role$'] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
          case 'contains': condition['$resource.resource_role$'] = { [Op.iLike]: `%${value}%` }; break;
          case 'is_empty': condition['$resource.resource_role$'] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;
      case 'project_code':
        switch (operator.toLowerCase()) {
          case 'equals': condition['$project.project_code$'] = { [Op.iLike]: value }; break;
          case 'not_equals': condition['$project.project_code$'] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
          case 'contains': condition['$project.project_code$'] = { [Op.iLike]: `%${value}%` }; break;
          case 'is_empty': condition['$project.project_code$'] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;  
      case 'comments':        
      case 'description':
      case 'r_number':    
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.iLike]: value }; break;
          case 'not_equals': condition[field] = { [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }] }; break;          
          case 'contains': condition[field] = { [Op.iLike]: `%${value}%` }; break;
          case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;

      case 'start_date':
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

      case 'resource_type_rid':
        switch (operator.toLowerCase()) {
          case 'equals': condition['$resource.resource_type_rid$'] = { [Op.eq]: value }; break;
          case 'not_equals': condition['$resource.resource_type_rid$'] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;          
          case 'in': condition['$resource.resource_type_rid$'] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
          case 'is_empty': condition['$resource.resource_type_rid$'] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;  
      case 'resource_rid':
      case 'project_rid':     
      case 'country_rid':
      case 'region_rid':    
        switch (operator.toLowerCase()) {
          case 'equals': condition[field] = { [Op.eq]: value }; break;
          case 'not_equals': condition[field] = { [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }] }; break;          
          case 'in': condition[field] = { [Op.in]: Array.isArray(value) ? value : [value] }; break;
          case 'is_empty': condition[field] = { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] }; break;
        }
        break;

      default:
        console.log(`Unhandled filter field: ${field}`);
    }

    if (Object.keys(condition).length > 0) {
      whereClause[Op.and].push(condition);
    }
  });

  return { whereClause: whereClause[Op.and].length > 0 ? whereClause : {} };
}


async fetchAttachmentsBytaskId(task_rid: string): Promise<any[]> {
  try {
    const sequelize = await initMainDbSequelize();
    
    const result = await sequelize.query(`
      SELECT 
        a.*
      FROM "${MAIN_SCHEMA_NAME}"."attachment_summary" a
      WHERE a.attach_to = :task_rid
      ORDER BY a.created_datetime DESC
    `, {
      replacements: { task_rid },
      type: "SELECT"
    });

    return result;
  } catch (error) {
    console.error('Error fetching attachments:', error);
    throw new Error('Failed to fetch attachments');
  }
}


  async insertUserDetails(taskData: any): Promise<any> {
    try {
      const mainDbInit = await initMainDbSequelize();

      const createdById = taskData.created_by;
      const modifiedById = taskData.modified_by;

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results] = await mainDbInit.query(
          `SELECT first_name, middle_name, last_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId`,
          {
            replacements: { userId },
            type: "SELECT",
          }
        );

        if (!results) return null;

        const { first_name, middle_name, last_name } = results as any;
        return [first_name, middle_name, last_name].filter(Boolean).join(" ");
      };

      const createdName = await getUserFullName(createdById);
      console.log("createdName :",createdName);
      const modifiedName = await getUserFullName(modifiedById);

      return {
        ...taskData,
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }


  /**
   * Formats an error response to be returned from service methods.
   *
   * @param {Error} err - The caught error.
   * @returns {object} - Standardized error response object.
   */
  throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }

}