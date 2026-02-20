import { Op, QueryTypes, Sequelize } from "sequelize";
import { errorLog, isValidTimezone, logMessage } from "./helpers";
import { DOSSIER_NAME, MAIN_SCHEMA_NAME, rawQueries } from "./constants";
import { initOrgSequelize } from "../config/orgDataSource";
import { initMainDbSequelize } from "../config/mainDataSource";
import { ProjectFiscal } from "../models/projectFiscal";
import moment from "moment";
import { DossierForm } from "../models/dossierForm";
import dayjs from "dayjs";

export function buildRawWhereClause(
    filters: Record<string, any>,
    search?: string
  ): { whereClause: any } {
    const whereClause: any = {
      [Op.and]: [],
    };

    // Search logic
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { document_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { comments: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

  // Filter logic for your input structure
  Object.entries(filters).forEach(([field, filter]) => {
    if (!filter || typeof filter !== 'object') {
      logMessage(`Skipping filter for field ${field} due to invalid structure`);
      return;
    }

      const operator = Object.keys(filter)[0];
      const value = filter[operator!];

    if (!operator || value === undefined) {
     logMessage(`Skipping filter for field ${field} due to missing operator or value`);
      return;
    }

      const condition: any = {};

      switch (field) {
        case "size_in_mb":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: Number(value) };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: Number(value) }, { [Op.is]: null }],
              };
              break;
            case "less_than":
              condition[field] = { [Op.lt]: Number(value) };
              break;
            case "greater_than":
              condition[field] = { [Op.gt]: Number(value) };
              break;
            case "between":
              if (Array.isArray(value)) {
                condition[field] = {
                  [Op.between]: [Number(value[0]), Number(value[1])],
                };
              }
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: 0 }],
              };
              break;
          }
          break;

        case "document_name":
        case "attachment_level":
        case "format":
        case "comments":
        case "attached_to":
        case "attach_to":
        case "r_number":
        case "uploaded_by":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.iLike]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.notILike]: value }, { [Op.is]: null }],
              };
              break;
            case "contains":
              condition[field] = { [Op.iLike]: `%${value}%` };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
          }
          break;

        case "created_datetime":
          switch (operator.toLowerCase()) {
            case "equals": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") = DATE('${date.toISOString()}')`
              );
              break;
            }
            case "before": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") < DATE('${date.toISOString()}')`
              );
              break;
            }
            case "after": {
              const date = new Date(value);
              condition[field] = Sequelize.literal(
                `DATE("${field}") > DATE('${date.toISOString()}')`
              );
              break;
            }
            case "between": {
              if (Array.isArray(value)) {
                const startDate = new Date(value[0]);
                const endDate = new Date(value[1]);
                condition[field] = Sequelize.literal(
                  `DATE("${field}") BETWEEN DATE('${startDate.toISOString()}') AND DATE('${endDate.toISOString()}')`
                );
              }
              break;
            }
            case "is_empty":
              condition[field] = { [Op.is]: null };
              break;
          }
          break;

        case "document_type_rid":
        case "document_category_rid":
        case "fiscal_year":
          switch (operator.toLowerCase()) {
            case "equals":
              condition[field] = { [Op.eq]: value };
              break;
            case "not_equals":
              condition[field] = {
                [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
              };
              break;
            case "in":
              condition[field] = {
                [Op.in]: Array.isArray(value) ? value : [value],
              };
              break;
            case "is_empty":
              condition[field] = {
                [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
              };
              break;
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

  export async function getResourceCostsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceCostEntriesQuery(schemaName);

      const sequelize = await initOrgSequelize();
      const results = await sequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

    return results;

  } catch (error) {
    errorLog(`Error fetching resource costs by resource IDs: ${(error as Error).message}`);
    throw error;
  }
}

  export async function getResourceSkillsByResourceIds(
    accountNumber: string,
    resourceIds: string[]
  ): Promise<any[]> {
    try {
      if (resourceIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.getLatestResourceSkillsQuery(schemaName);

      const sequelize = await initOrgSequelize();
      const results = await sequelize.query(query, {
        replacements: { resourceIds },
        type: "SELECT",
      });

    return results;

  } catch (error) {
    errorLog("Error fetching resource skills by resource IDs: " + (error as Error).message);
    throw error;
  }
}

export async function getProjectResourcesByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (projectIds.length === 0) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;

      const query = rawQueries.fetchProjectResourceAndFiscal(schemaName);

      const sequelize = await initOrgSequelize();
      const results = await sequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project resources (bulk):", error);
      throw error;
    }
  }

  export async function getProjectTasksByProjectIds(
    accountNumber: string,
    projectIds: string[]
  ): Promise<any[]> {
    try {
      if (!projectIds?.length) return [];

      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
        /\D/g,
        ""
      )}`;
      const sequelize = await initOrgSequelize();

      // Check if project_task table exists
      const checkTableQuery = rawQueries.checkProjectTaskExists(schemaName);

      const [tableExists] = await sequelize.query(checkTableQuery, {
        type: "SELECT",
      });

      if ((tableExists as any).exists === false) {
        return [];
      }

      const query = rawQueries.fetchProjectTaskAndFiscal(schemaName);

      const results = await sequelize.query(query, {
        replacements: { projectIds },
        type: "SELECT",
      });

      return results;
    } catch (error) {
      console.error("Error fetching project tasks:", error);
      throw error;
    }
  }

  export async function getProjectsByAccountId(schemaNumber: string, accountRid: string) {
    const sequelize = await initMainDbSequelize();
    const {ProjectFiscalModel} = await getModels(schemaNumber);
    return ProjectFiscalModel.findAll({
      where: {
        account_rid: accountRid,
      },
      order: [["created_datetime", "DESC"]],
    });
  }

export async function getResourcesByAccountId(accountNumber: string, accountRid: string) {
    try {
      const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(/\D/g, '')}`;

      const query = rawQueries.getResourcesByAccountQuery(schemaName);

      const sequelize = await initOrgSequelize();
      const results = await sequelize.query(query, {
        replacements: { accountRid },
        type: 'SELECT'
      });

      return results;

    } catch (error) {
      errorLog("Error fetching resources by account ID:", (error as Error).message);
      throw error;
    }
  }
  export async function fetchProjectResourceById(
    accountNumber: string,
    projectResourceId: string
  ) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchProjectResourceById(schemaName);

    const sequelize = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { projectResourceId },
      type: "SELECT",
      raw: true,
    });
    return result[0];
  }
export async function getAttachmentDisplayNames(attachments: any[], schemaNumber: string, type? : string): Promise<Record<string, string>> {
  const displayNames: Record<string, string> = {};
  for (const attachment of attachments) {
    try {
      switch (attachment.attachment_level) {
        case 'account':
          const account = await fetchAccountById(attachment.attach_to);
          displayNames[attachment.rid] = account?.account_name || attachment.attach_to;
          break;
        case 'project':
          const project = await fetchProjectInfoById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = project?.project_code || attachment.attach_to;
          if(type === DOSSIER_NAME) {
            attachment.dataValues.project_code = project?.project_code || ''
            attachment.dataValues.project_name = project?.project_name || ''
          }
          break;
        case 'project_resource':
          const projectResource = await fetchProjectResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectResource as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'project_task':
          const projectTask = await fetchProjectTaskById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (projectTask as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'resource':
          const resource = await fetchResourceById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resource as { resource_code?: string })?.resource_code || attachment.attach_to;
          break;
        case 'resource_cost':
          const resourceCost = await fetchResourceCostById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceCost as { r_number?: string })?.r_number || attachment.attach_to;
          break;
        case 'resource_skill': 
          const resourceSkill = await fetchResourceSkillById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (resourceSkill as { r_number?: string })?.r_number || attachment.attach_to;
          break;     
        case 'case': 
          const cases = await fetchCaseById(schemaNumber, attachment.attach_to);
          displayNames[attachment.rid] = (cases as { case_name?: string })?.case_name || attachment.attach_to;
          break;     
        default:
          displayNames[attachment.rid] = attachment.attach_to;
      }
    } catch (err) {
      errorLog(`Error fetching display name for attachment ${attachment.rid}:`, (err as Error).message);
      displayNames[attachment.rid] = attachment.attach_to;
    }
  }
  
  return displayNames;
}
  async function fetchAccountById(accountId: string) {
    try {
      const mainDbSequelize = await initMainDbSequelize();
      const [accountData]: any[] = await mainDbSequelize.query(
        rawQueries.getAccountWithStatusByRidQuery(),
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      return accountData;
    } catch (err) {
      errorLog("Error fetching Accounts: " + (err as Error).message);
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }

    async function fetchProjectInfoById(accountNumber: string, projectId: string) {
    const {ProjectFiscalModel} = await getModels(accountNumber);

    const projectData = await ProjectFiscalModel.findOne({
      where: {
        rid: projectId,
      },
      attributes: ["rid", "project_code", "currency_rid", "project_name"],
    });

    return projectData;
  }


  async function fetchProjectTaskById(accountNumber: string, projectTaskId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchProjectTaskById(schemaName);

    const sequelize = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { projectTaskId },
      type: "SELECT",
      raw: true,
    });
    return result[0];
  }

  async function fetchResourceById(accountNumber: string, resourceId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceById(schemaName);

    const sequelize = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async function fetchResourceCostById(accountNumber: string, resourceCostId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceCostById(schemaName);

    const sequelize = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceCostId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

  async function fetchResourceSkillById(accountNumber: string, resourceSkillId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchResourceSkillById(schemaName);

    const sequelize = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { resourceSkillId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

    async function fetchCaseById(accountNumber: string, caseId: string) {
    const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
      /\D/g,
      ""
    )}`;

    const query = rawQueries.fetchCaseById(schemaName);

    const sequelize  = await initOrgSequelize();
    const result = await sequelize.query(query, {
      replacements: { caseId },
      type: "SELECT",
      raw: true,
    });

    return result[0];
  }

    async function getModels(schemaName: string) {
    const sequelize = await initOrgSequelize();
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    const DossierFormModel = DossierForm.initialise(sequelize, schemaName)
    return {
      ProjectFiscalModel,
      DossierFormModel
    }
}

  async function getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    const mainDbSequelize = await initMainDbSequelize();
    const [userInfo] = (await mainDbSequelize.query(
      rawQueries.fetchProfileFromUser(),
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    )) as [{ profile_rid: string }] | [];

    if (!userInfo?.profile_rid) {
      return [];
    }

    const [profileFields, userFields] = await Promise.all([
      mainDbSequelize.query(
        rawQueries.getProfileFieldsAccessQuery(),
        {
          replacements: {
            permissionName: permission_name,
            profileId: userInfo?.profile_rid,
          },
          type: "SELECT",
        }
      ),
      mainDbSequelize.query(
        rawQueries.getUserFieldsAccessQuery(),
        {
          replacements: {
            permissionName: permission_name,
            userId,
          },
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    // Merge: user overrides profile
    const userFieldMap = new Map<string, any>();
    for (const field of userFields as any[]) {
      userFieldMap.set(field.field_name, field);
    }

    const merged = (profileFields as any[]).map((pf) => {
      const userPerm = userFieldMap.get(pf.field_name);
      if (userPerm) {
        userFieldMap.delete(pf.field_name);
        return {
          field_desc: pf.field_desc,
          field_name: pf.field_name,
          read: pf.read ? true : userPerm?.read === true,
        };
      }
      return {
        field_desc: pf.field_desc,
        field_name: pf.field_name,
        read: pf.read,
      };
    });

    const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
      field_desc: uf.field_desc,
      field_name: uf.field_name,
      read: uf.read,
    }));

    const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
    return exportableFields;
  }

  export function mapAttachmentToCommonFormat(at: any, timezone : string) {
    return {
      "Project Code": at.project_code || "-",
      "Name": at.project_name || "-",
      "Document Name": at.document_name || "-",
      Format: at.format || "-",
      Size: at.size_in_mb || "-",
      "Fiscal Year": `FY-${at.fiscal_year}` || "-",
      "Document Category": at.document_category || "-",
      "Document Type": at.document_type || "-",
      "Related Entity": at.attachment_level || "-",
      "Related To ID": at.attach_to || "-",
      "Related To Name": at.attached_to || "-",
      "Attached By": at.uploaded_by || "-",
      "Attached On": at.created_datetime
        ? timezone && isValidTimezone(timezone)
        ? moment(at.created_datetime)
            .tz(timezone)
            .format("YYYY-MMM-DD, hh:mm:ss A")
        : moment(at.created_datetime).format(
            "YYYY-MMM-DD, hh:mm:ss A"
          )
      : "-",
      "Attachment ID": at.r_number || "-",
    };
  }

  export function processTextFilter(field: string, value: any,  whereClause: Record<string | symbol, any>): void {
    if (typeof value === 'string') {
      // Simple string value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        value.equals.toLowerCase()
      );
      } else if (value.not_equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        '!=',
        value.not_equals.toLowerCase()
      );
      } else if (value.contains !== undefined) {
        whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
      } else if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[Op.or] = value.in.map((val: string) =>
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(field)),
          '=',
          val.toLowerCase()
        )
      );
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = { [Op.or]: [null, ''] };
        } else {
          whereClause[field] = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
        }
      }
    }
  }
  export function processNumberFilter(field: string, value: any, whereClause: Record<string | symbol, any>): void {
    if (typeof value === 'number') {
      // Simple number value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = value.equals;
      } else if (value.not_equals !== undefined) {
        whereClause[field] = { [Op.ne]: value.not_equals };
      } else if (value.greater_than !== undefined) {
        whereClause[field] = { ...(whereClause[field] || {}), [Op.gt]: value.greater_than };
      } 
      if (value.less_than !== undefined) {
        whereClause[field] = { ...(whereClause[field] || {}), [Op.lt]: value.less_than };
      }
      if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[field] = { [Op.in]: value.in };
      }
      // Support for between operator (e.g., { between: [min, max] })
      if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
        whereClause[field] = {
          ...(whereClause[field] || {}),
          [Op.gte]: value.between[0],
          [Op.lte]: value.between[1],
        };
      }
    }
      if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
  
  export function processDateFilter(
    field: string,
    value: any,
    whereClause: Record<string, any>
  ): void {
    if (typeof value === 'string') {
      const date = dayjs(value, 'YYYY-MM-DD').startOf('day').toDate();
      const nextDay = dayjs(date).add(1, 'day').toDate();

      whereClause[field] = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        const date = dayjs(value.equals, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const nextDay = dayjs(date).add(1, 'day').toDate();

        whereClause[field] = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      } else if (value.before !== undefined) {
        const beforeDate = dayjs(value.before, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.lt]: beforeDate };
      } else if (value.after !== undefined) {
        const afterDate = dayjs(value.after, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.gt]: afterDate };
      } else if (value.between[0] && value.between[1]) {
        const fromDate = dayjs(value.between[0], 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const toDate = dayjs(value.between[1], 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');

        whereClause[field] = {
          [Op.gte]: fromDate,
          [Op.lte]: toDate
        };
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
  }

  export function processProjectCountFilter(value: any, whereClause: Record<string, any>, schemaName: string): void {
  const conditions: any[] = [];
  
  if (typeof value === 'number') {
    conditions.push(createProjectCountCondition('=', value,schemaName));
  } else if (value && typeof value === 'object') {
    if ('equals' in value) {
      conditions.push(createProjectCountCondition('=', value.equals,schemaName));
    }
    if ('not_equals' in value) {
      conditions.push(createProjectCountCondition('!=', value.not_equals,schemaName));
    }
    if ('greater_than' in value) {
      conditions.push(createProjectCountCondition('>', value.greater_than,schemaName));
    }
    if ('less_than' in value) {
      conditions.push(createProjectCountCondition('<', value.less_than,schemaName));
    }
    if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
      conditions.push({
        [Op.and]: [
          createProjectCountCondition('>=', value.between[0],schemaName),
          createProjectCountCondition('<=', value.between[1],schemaName),
        ]
      });
    }
    if ('is_empty' in value) {
      conditions.push(
        value.is_empty
          ? createProjectCountCondition('=', 0, schemaName)
          : createProjectCountCondition('>', 0, schemaName)
      );
    }
  }

  if (conditions.length > 0) {
    if (!whereClause[Op.and as any]) {  // Type assertion for Op.and
      whereClause[Op.and as any] = [];
    }
    (whereClause[Op.and as any] as any[]).push(...conditions);
  }
}

function createProjectCountCondition(operator: string, value: number,schemaName: string): any {
  return {
    [Op.and as any]: [  // Type assertion for Op.and
      Sequelize.literal(`(
        SELECT COUNT(*)
          FROM "${schemaName}"."interactions" AS i
          WHERE i.account_interaction_rid = "AccountInteractions"."rid"
      ) ${operator} ${value}`)
    ]
  };
}

  export function getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "created_datetime",
      "modified_datetime",     
       "version",
      "status",
      "project_count"
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }