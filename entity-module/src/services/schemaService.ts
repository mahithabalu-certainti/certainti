import moment, { Moment } from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources, setupResourceSeq } from "../models/resource";
import {
  ICreateResource,
  IKeyContactDetail,
  IUpdateKeyContactDetail,
  IUpdateResource,
} from "../utils/types";

import { DataTypes, Op, QueryTypes, Sequelize } from "sequelize";
import {
  ResourceFiscal,
  setupResourceFiscalSeq,
} from "../models/resourceFiscal";
import { initMainDbSequelize } from "../config/mainDataSource";
import {
  ResourcesHistory,
  setupResourceHistorySeq,
} from "../models/resourceHistory";
import {
  ResourcesTimeline,
  setupResourceTimelineSeq,
} from "../models/resourceTimeline";
import { ResourceCost, setupResourceCostSeq } from "../models/resourceCost";
import {
  ResourceCostTimeline,
  setupResourceCostTimelineSeq,
} from "../models/resourceCostTimeline";
import {
  ResourceCostHistory,
  setupResourceCostHistorySeq,
} from "../models/resourceCostHistory";
import { ResourceSkill, setupResourceSkillSeq } from "../models/resourceSkill";
import {
  ResourceSkillTimeline,
  setupResourceSkillTimelineSeq,
} from "../models/resourceSkillTimeline";
import {
  ResourceSkillHistory,
  setupResourceSkillHistorySeq,
} from "../models/resourceSkillHistory";
import { KeyContact } from "../models/keyContactDetails";
import AccountDetails from "../models/accountDetails";
import { SCHEMANAME_PREFIX, entityTypes, eventNames, eventTypes, primaryKeyContacts, rawQueries } from "../utils/constants";
import {
  ResourceFiscalRegion,
  setupResourceFiscalRegionSeq,
} from "../models/resourceFiscalRegion"
import { errorLog } from "../utils/helpers";
import { checkProjectMappedToProjectRes } from "../utils/rawQueries";
import ProjectIngestionService from "./projectIngestionService";
import { raw } from "express";



// import { Skill } from "../models/skill";
class SchemaService {
  constructor() { }

  /**
   * Checks if the schema for a given account number exists.
   * @param accountNumber - The account number to check.
   * @returns A boolean indicating if the schema exists.
   */
  async checkIfSchemaExists(accountNumber: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const result = await sequelize.query(
        rawQueries.getSchemaExistenceQuery(),
        {
          replacements: { schemaName },
          type: "SELECT",
        }
      );

      return (result as any[]).length !== 0;
    } catch (err) {
      throw new Error("Error checking schema :" + (err as Error).message);
    }
  }

  /**
   * Validates if an account number and ID pair exists.
   * @param accountNumber - The account number.
   * @param accountId - The account ID.
   * @returns Account existence status and related metadata.
   */
  async checkAccountIdAndNumber(
    accountNumber: string,
    accountId: string
  ): Promise<{
    isAccountExist: boolean;
    dataStorage: string;
    parentAccountId: string;
  }> {
    try {
      const mainDbSequelize = await initMainDbSequelize();

      const [account]: any[] = await mainDbSequelize.query(
        rawQueries.getAccountByRidAndNumberQuery(),
        {
          replacements: { rid: accountId, r_number: accountNumber },
          type: "SELECT",
        }
      );

      return {
        isAccountExist: !!account,
        dataStorage: account?.storage_type ?? null,
        parentAccountId: account?.parent_account_rid ?? null,
      };
    } catch (err) {
      throw new Error("Error checking account :" + (err as Error).message);
    }
  }

  /**
   * Creates the resource-related tables for a given account schema.
   * @param accountNumber - The account number to initialize tables for.
   */
  async createResourceTable(accountNumber: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const AccountDetailsModel = await AccountDetails.initialize(
        sequelize,
        schemaName
      );

      const Resource = Resources.initialize(sequelize, schemaName);
      const ResourcesHistoryModel = await ResourcesHistory.initialize(
        sequelize,
        schemaName
      );
      const ResourcesTimelineModel = await ResourcesTimeline.initialize(
        sequelize,
        schemaName
      );

      const ResourceCostModel = await ResourceCost.initialize(
        sequelize,
        schemaName
      );

      const ResourceCostTimelineModel = await ResourceCostTimeline.initialize(
        sequelize,
        schemaName
      );

      const ResourceCostHistoryModel = await ResourceCostHistory.initialize(
        sequelize,
        schemaName
      );

      // const SkillModel = await Skill.initialize(sequelize, schemaName);
      const ResourceSkillModel = await ResourceSkill.initialize(
        sequelize,
        schemaName
      );

      const ResourceSkillTimelineModel = await ResourceSkillTimeline.initialize(
        sequelize,
        schemaName
      );

      const ResourceSkillHistoryModel = await ResourceSkillHistory.initialize(
        sequelize,
        schemaName
      );

      const ResourceFiscalModel = await ResourceFiscal.initialize(
        sequelize,
        schemaName
      );
      const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
        sequelize,
        schemaName
      );

      Resource.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resources_account",
      });

      ResourceFiscalModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resources_fiscal_account",
      });

      ResourceFiscalModel.belongsTo(Resource, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resources_fiscal_resource",
      });

      ResourceFiscalRegionModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resources_fiscal_region_account",
      });

      ResourceFiscalRegionModel.belongsTo(Resource, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resources_fiscal_region_resource",
      });

      ResourcesTimelineModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resources_timeline_account",
      });

      ResourcesTimelineModel.belongsTo(Resource, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resources_timeline_resource",
      });

      ResourcesHistoryModel.belongsTo(Resources, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resources_history_resource",
      });

      ResourceCostModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resource_cost_account",
      });
      ResourceCostModel.belongsTo(Resource, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resource_cost_resource",
      });

      ResourceCostTimelineModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resource_cost_timeline_account",
      });
      ResourceCostTimelineModel.belongsTo(Resource, {
        foreignKey: "entity_rid",
        targetKey: "rid",
        as: "resource_cost_timeline_resource",
      });

      ResourceCostHistoryModel.belongsTo(Resource, {
        foreignKey: "resource_cost_rid",
        targetKey: "rid",
        as: "resource_cost_history_resource",
      });

      ResourceSkillModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resource_skill_account",
      });
      ResourceSkillModel.belongsTo(Resource, {
        foreignKey: "resource_rid",
        targetKey: "rid",
        as: "resource_skill_resource",
      });

      ResourceSkillTimelineModel.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        targetKey: "account_rid",
        as: "resource_skill_timeline_account",
      });
      ResourceSkillTimelineModel.belongsTo(Resource, {
        foreignKey: "entity_rid",
        targetKey: "rid",
        as: "resource_skill_timeline_resource",
      });

      ResourceSkillHistoryModel.belongsTo(Resource, {
        foreignKey: "resource_skill_rid",
        targetKey: "rid",
        as: "resource_skill_history_resource",
      });

      await Resource.sync({ force: false });
      await ResourcesHistoryModel.sync({ force: false });
      await ResourcesTimelineModel.sync({ force: false });
      await ResourceFiscalRegionModel.sync({ force: false });
      await ResourceCostModel.sync({ force: false });
      await ResourceCostTimelineModel.sync({ force: false });
      await ResourceCostHistoryModel.sync({ force: false });
      // await SkillModel.sync({ force: false });
      await ResourceSkillModel.sync({ force: false });
      await ResourceSkillTimelineModel.sync({ force: false });
      await ResourceSkillHistoryModel.sync({ force: false });
      await setupResourceSeq(sequelize, schemaName);
      await setupResourceHistorySeq(sequelize, schemaName);
      await setupResourceTimelineSeq(sequelize, schemaName);
      await setupResourceFiscalRegionSeq(sequelize, schemaName);
      await setupResourceCostSeq(sequelize, schemaName);
      await setupResourceCostTimelineSeq(sequelize, schemaName);
      await setupResourceCostHistorySeq(sequelize, schemaName);
      await setupResourceSkillSeq(sequelize, schemaName);
      await setupResourceSkillTimelineSeq(sequelize, schemaName);
      await setupResourceSkillHistorySeq(sequelize, schemaName);
    } catch (err) {
      throw new Error(
        "Error creating table resources: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches paginated and filtered list of resources.
   * @param accountNumber - Account number.
   * @param offset - Offset for pagination.
   * @param limit - Number of results per page.
   * @param order - Sorting order array (e.g., [['name', 'ASC']]).
   * @param whereClause - Filters applied on query.
   * @param fiscalYear - Fiscal year to filter resources.
   * @returns List of matching resources.
   */
  async fetchResources(
    accountNumber: string,
    offset: number,
    limit: number,
    order: any[],
    whereClause: Record<string, string> = {},
    havingClause: Record<string, string> = {},
    geoDataSort: string[][],
    accountId: string,
    documentRid?: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const mainDdSequilze = await initMainDbSequelize();
      let finalResources = null;

      const Resource = Resources.initialize(sequelize, schemaName);
      await Resource.sync({ force: false });

      // Handle special case for resource_type sorting
      let queryOrder = order;
      const isAccountNameSort = order?.length && order[0][0] === "account_name";
      const isTotalProjectHoursSort =
        order?.length && order[0][0] === "total_project_hours";
      const isEstimatedRDSort =
        order?.length && order[0][0] === "estimated_rd_hours";
      if (isAccountNameSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [
          [Sequelize.col("AccountDetails.account_name"), direction],
        ];
      } else if (isTotalProjectHoursSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal("total_project_hours"), direction]];
      } else if (isEstimatedRDSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal("estimated_rd_hours"), direction]];
      }

      const AccountDetailsModel = AccountDetails.initialize(
        sequelize,
        schemaName
      );
      const ResourceFiscalModel = ResourceFiscal.initialize(
        sequelize,
        schemaName
      );

      const ResourceTimelineModel = ResourcesTimeline.initialize(sequelize, schemaName);


      Resource.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        as: "AccountDetails",
        targetKey: "account_rid",
      });

      Resource.hasMany(ResourceFiscalModel, {
        foreignKey: "resource_rid",
        sourceKey: "rid",
        as: "ResourceFiscal",
      });

      Resource.hasMany(ResourceTimelineModel, {
        foreignKey: "entity_rid",
        sourceKey: "rid",
        as: "ResourceTimelines",
      });

      // Build the include array dynamically
      const include: any[] = [
        {
          model: ResourceFiscalModel,
          as: "ResourceFiscal",
          attributes: [],
          required: false,
        },
        {
          model: AccountDetailsModel,
          as: "AccountDetails",
          attributes: [],
          required: false,
        },
      ];

      // Add ResourceTimeline join if documentRid is provided
      if (documentRid) {
        include.push({
          model: ResourceTimelineModel,
          as: "ResourceTimelines",
          required: true,
          where: {
            document_rid: documentRid
          },
          attributes: [] // Only join, don't select fields
        });
      }

      // First get all resources without pagination
      const resources = await Resource.findAll({
        where: {
          ...whereClause,
          account_rid: accountId,
        },
        having: havingClause,
        group: [
          "Resources.rid",
          "Resources.r_number",
          "Resources.resource_code",
          "Resources.resource_name",
          "Resources.resource_firstname",
          "Resources.resource_lastname",
          "Resources.resource_orgname",
          "Resources.comments",
          "Resources.resource_type_rid",
          "Resources.status_rid",
          "Resources.resource_role",
          "Resources.resource_designation",
          "Resources.resource_total_experience",
          "Resources.country_rid",
          "Resources.region_rid",
          "Resources.city_rid",
          "AccountDetails.rid",
          "AccountDetails.account_rid",
          "AccountDetails.account_name",
          "ResourceFiscal.rid",
        ],
        order: queryOrder,
        subQuery: false,
        attributes: [
          "rid",
          "r_number",
          "resource_code",
          "resource_name",
          "resource_firstname",
          "resource_lastname",
          "resource_type_rid",
          "status_rid",
          "resource_role",
          "resource_designation",
          "resource_orgname",
          "comments",
          "resource_total_experience",
          "country_rid",
          "region_rid",
          "city_rid",
          [Sequelize.col("AccountDetails.account_name"), "account_name"],
          [
            Sequelize.literal(
              '"ResourceFiscal"."total_effort_for_year_project"'
            ),
            "total_project_hours",
          ],
          [
            Sequelize.literal('"ResourceFiscal"."estimated_rd_hours"'),
            "estimated_rd_hours",
          ],
        ],
        include: include,
      });

      if (resources) {
        // Process geo data for all records
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortGeoData(finalResources, geoDataSort);

        // Apply pagination after geo processing
        const totalCount = finalResources.length;
        finalResources = finalResources.slice(offset, offset + limit);

        return { resources: finalResources, totalCount };
      }

      return { resources: [], totalCount: 0 };
    } catch (err) {
      errorLog("Error fetching resources: " + (err as Error).message);
      throw new Error("Error fetching resources: " + (err as Error).message);
    }
  }

  /**
   * Fetches a single resource by ID.
   * @param accountNumber - Account number (schema).
   * @param accountId - Resource ID (RID).
   * @returns Resource record or null.
   */
  async fetchResourceById(accountNumber: string, resourceId: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);
      const resource = await Resource.findOne({
        where: {
          rid: resourceId,
        },
      });
      return resource;
    } catch (err) {
      throw new Error(
        "Error creating table resources: " + (err as Error).message
      );
    }
  }

  /**
   * Inserts a new resource record into the resource table.
   * @param resourceData - Data for the new resource.
   * @param startDate - Moment object of start date.
   * @param endDate - Moment object of end date.
   * @param accountNumber - Account number (schema).
   * @returns Created resource object.
   */
  async insertResourcesTable(
    resourceData: ICreateResource,
    startDate: Moment,
    endDate: Moment,
    accountNumber: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);

      const isRefIdExist = await Resource.findOne({
        where: {
          resource_code: {
            [Op.iLike]: resourceData.resource_code,
          },
          account_rid: resourceData.account_id,
        },
      });

      if (isRefIdExist) {
        errorLog("Resource Code must be unique");
        throw new Error("Resource Code must be unique.");
      }

      const resourceObject = {
        resource_code: resourceData.resource_code,
        resource_type_rid: resourceData.resource_type_rid,
        resource_name: resourceData.name || null,
        resource_firstname: resourceData.first_name || null,
        resource_lastname: resourceData.last_name || null,
        status_rid: resourceData.status_rid || null,
        resource_orgname: resourceData.org_name || null,
        resource_startdate: moment(startDate).isValid()
          ? moment(startDate).toDate()
          : null,
        resource_enddate: moment(endDate).isValid()
          ? moment(endDate).toDate()
          : null,
        resource_role: resourceData.role || null,
        region_rid: resourceData.region_rid || null,
        country_rid: resourceData.country_rid || null,
        city_rid: resourceData.city_rid || null,
        resource_designation: resourceData.resource_designation || null,
        resource_total_experience: resourceData.total_years_experience || null,
        resource_total_experience_organization:
          resourceData.total_years_in_org || null,
        created_by: resourceData.created_by ?? "",
        account_rid: resourceData.account_id,
        comments: resourceData.comments || "",
      };

      const resource = await Resource.create(resourceObject);

      if (resource && resource.rid) {
        // this.insertResourceFiscalTable(
        //   sequelize,
        //   schemaName,
        //   resourceData,
        //   resource.rid,
        //   startDate,
        //   endDate
        // );
        // if(resourceData.region_rid)
        // this.insertResourceFiscalRegionTable(
        //   sequelize,
        //   schemaName,
        //   resourceData,
        //   resource.rid,
        //   startDate,
        //   endDate
        // );

        this.addTimeline(
          accountNumber,
          resourceData,
          resource.rid,
          "create",
          resource.account_rid
        );
      }
      const userEventInfo: any = await this.fetchUserAndEventInfo({
        userId: resourceData.created_by!,
        eventType: eventTypes.UI_HANDLER
      });

      await this.createAccountTimelineEntry(accountNumber!, {
        created_by: resourceData.created_by!,
        account_rid: resourceData.account_id,
        entity_rid: resource?.rid!,
        entity_name: entityTypes.RESOURCE,
        created_by_name: userEventInfo.full_name,
        event_type_rid: userEventInfo.event_type_rid,
        event_name: eventNames.CREATE,
        descriptions: resourceData.resource_code
      }, ["account"]);

      return resource;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  /**
   * Fetches user full name, event type, and event name in a single query.
   * @param params Object with userId, eventType, eventName
   * @returns Object with fullName, eventType, eventName
   */
  async fetchUserAndEventInfo(params: { userId: string; eventType: string; }) {
    const sequelize = await initMainDbSequelize();
    // Assumes the rawQueries have the correct SQL for each subquery
    // This query returns a single row with all three values
    const query = rawQueries.fetchUserAndEventInfo();
    const [result] = await sequelize.query(query, {
      replacements: {
        userId: params.userId,
        eventType: params.eventType
      },
      type: "SELECT",
    });
    return result;
  }
  /**
 * Returns timeline entity types for a given attachment_level.
 * Used for timeline entry creation in NotesService and elsewhere.
 */
  getTimelineTypesForAttachmentLevel(attachmentLevel: string): string[] {
    const accountLevels = ["account", "resource", "resource_cost", "resource_skill"];
    const projectLevels = ["project_task", "project_resource"];
    const caseLevels = ["case"];
    if (attachmentLevel === "project") {
      return ["project"];
    } else if (accountLevels.includes(attachmentLevel)) {
      return ["account"];
    } else if (projectLevels.includes(attachmentLevel)) {
      return ["project"];
    } else if (caseLevels.includes(attachmentLevel)) {
      return ["case"];
    }
    return [];
  }
  /**
   * Create an entry in the account_timeline table for the given schema.
   * @param sequelize Sequelize instance connected to the main DB
   * @param schemaName The schema name where the account_timeline table exists
   * @param entryData Object containing the timeline entry fields
   */
  async createAccountTimelineEntry(accountNumber: string,
    entryData: {
      created_by: string;
      account_rid: string;
      entity_rid: string;
      entity_name: string;
      created_by_name: string;
      event_type_rid: string;
      event_name?: string;
      descriptions?: string;
      project_rid?: string;
      case_rid?: string;
    },
    entityTypes: string[]
  ) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
    const sequelize = await initOrgSequelize();
    for (const entityType of entityTypes) {
      if (entityType === "account") {
        const [result] = await sequelize.query(rawQueries.insertTimeLine(schemaName, "account_timeline"), {
          replacements: entryData,
          type: QueryTypes.INSERT,
        });
      }
      else if (entityType === "project") {
        const [result] = await sequelize.query(rawQueries.insertProjectTimeLine(schemaName, "project_timeline"), {
          replacements: entryData,
          type: QueryTypes.INSERT,
        });
      }
      else if (entityType === "case") {
        const [result] = await sequelize.query(rawQueries.insertCaseTimeLine(schemaName, "case_timeline"), {
          replacements: entryData,
          type: QueryTypes.INSERT,
        });
      }

    }
  }


  /**
   * Fetches paginated and filtered list of resources for excel download.
   * @param accountNumber - Account number.
   * @param order - Sorting order array (e.g., [['name', 'ASC']]).
   * @param whereClause - Filters applied on query.
   * @param fiscalYear - Fiscal year to filter resources.
   * @returns List of matching resources.
   */
  async fetchResourcesForExport(
    accountNumber: string,
    order: any[],
    whereClause: Record<string, string> = {},
    havingClause: Record<string, string> = {},
    geoDataSort: string[][],
    accountId: string,
    documentRid?: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const mainDdSequilze = await initMainDbSequelize();
      let finalResources = null;

      const Resource = Resources.initialize(sequelize, schemaName);
      await Resource.sync({ force: false });

      let queryOrder = order;
      const isResourceTypeSort =
        order?.length && order[0][0] === "resource_type";
      const isAccountNameSort = order?.length && order[0][0] === "account_name";
      const isTotalProjectHoursSort =
        order?.length && order[0][0] === "total_project_hours";
      const isEstimatedRDSort =
        order?.length && order[0][0] === "estimated_rd_hours";

      if (isResourceTypeSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [
          [
            Sequelize.literal(`
            CASE "Resources".resource_type
              WHEN 'Full-Time' THEN 1
              WHEN 'Non-Labor' THEN 2 
              WHEN 'Sub Con' THEN 3
              ELSE 4
            END
          `),
            direction,
          ],
        ];
      } else if (isAccountNameSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [
          [Sequelize.col("AccountDetails.account_name"), direction],
        ];
      } else if (isTotalProjectHoursSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal("total_project_hours"), direction]];
      } else if (isEstimatedRDSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal("estimated_rd_hours"), direction]];
      }

      const AccountDetailsModel = AccountDetails.initialize(
        sequelize,
        schemaName
      );
      const ResourceFiscalModel = ResourceFiscal.initialize(
        sequelize,
        schemaName
      );

      const ResourceTimelineModel = ResourcesTimeline.initialize(sequelize, schemaName);

      Resource.belongsTo(AccountDetailsModel, {
        foreignKey: "account_rid",
        as: "AccountDetails",
        targetKey: "account_rid",
      });

      Resource.hasMany(ResourceFiscalModel, {
        foreignKey: "resource_rid",
        sourceKey: "rid",
        as: "ResourceFiscal",
      });

      Resource.hasMany(ResourceTimelineModel, {
        foreignKey: "entity_rid",
        sourceKey: "rid",
        as: "ResourceTimelines",
      });

      // Build the include array dynamically
      const include: any[] = [
        {
          model: ResourceFiscalModel,
          as: "ResourceFiscal",
          attributes: [],
          required: false,
        },
        {
          model: AccountDetailsModel,
          as: "AccountDetails",
          attributes: [],
          required: false,
        },
      ];

      // Add ResourceTimeline join if documentRid is provided
      if (documentRid) {
        include.push({
          model: ResourceTimelineModel,
          as: "ResourceTimelines",
          required: true,
          where: {
            document_rid: documentRid
          },
          attributes: [] // Only join, don't select fields
        });
      }

      const resources = await Resource.findAll({
        where: {
          ...whereClause,
          account_rid: accountId,
        },
        having: havingClause,
        group: [
          "Resources.rid",
          "Resources.r_number",
          "Resources.resource_code",
          "Resources.resource_name",
          "Resources.resource_firstname",
          "Resources.resource_lastname",
          "Resources.resource_orgname",
          "Resources.comments",
          "Resources.resource_type_rid",
          "Resources.status_rid",
          "Resources.resource_role",
          "Resources.resource_designation",
          "Resources.resource_total_experience",
          "Resources.country_rid",
          "Resources.region_rid",
          "Resources.city_rid",
          "AccountDetails.rid",
          "AccountDetails.account_rid",
          "AccountDetails.account_name",
          "ResourceFiscal.rid",
        ],
        order: queryOrder,
        subQuery: false,
        attributes: [
          "rid",
          "r_number",
          "resource_code",
          "resource_name",
          "resource_firstname",
          "resource_lastname",
          "resource_type_rid",
          "status_rid",
          "resource_role",
          "resource_designation",
          "resource_orgname",
          "comments",
          "resource_total_experience",
          "country_rid",
          "region_rid",
          "city_rid",
          [Sequelize.col("AccountDetails.account_name"), "account_name"],
          [
            Sequelize.literal(
              '"ResourceFiscal"."total_effort_for_year_project"'
            ),
            "total_project_hours",
          ],
          [
            Sequelize.literal('"ResourceFiscal"."estimated_rd_hours"'),
            "estimated_rd_hours",
          ],
        ],
        include: include,
      });

      const results = await Resource.findAll({
        where: {
          ...whereClause,
          account_rid: accountId,
        },
        having: havingClause,
        group: [
          "Resources.rid",
          "Resources.r_number",
          "Resources.resource_code",
          "Resources.resource_name",
          "Resources.resource_firstname",
          "Resources.resource_lastname",
          "Resources.resource_orgname",
          "Resources.comments",
          "Resources.resource_type_rid",
          "Resources.status_rid",
          "Resources.resource_role",
          "Resources.resource_designation",
          "Resources.resource_total_experience",
          "Resources.country_rid",
          "Resources.region_rid",
          "Resources.city_rid",
          "AccountDetails.rid",
          "AccountDetails.account_rid",
          "AccountDetails.account_name",
          "ResourceFiscal.rid",
        ],
        raw: true,
        include: include,
      });

      const totalCount = results.length;

      if (resources) {
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortGeoData(finalResources, geoDataSort);
      }

      return { resources: finalResources, totalCount };
    } catch (err) {
      errorLog("Error fetching resources for export: " + (err as Error).message);
      throw new Error("Error fetching resources for export: " + (err as Error).message);
    }
  }

  /**
   * Inserts a record into the resource fiscal table.
   * @param sequelize - Sequelize instance.
   * @param schemaName - Schema name.
   * @param resourceData - Resource data object.
   * @param resourceId - Resource ID.
   * @param startDate - Start date (Moment).
   * @param endDate - End date (Moment).
   */
  async insertResourceFiscalTable(
    sequelize: Sequelize,
    schemaName: string,
    resourceData: ICreateResource,
    resourceId: string,
    startDate: Moment,
    endDate: Moment
  ) {
    try {
      const ResourceFiscalModel = await ResourceFiscal.initialize(
        sequelize,
        schemaName
      );
      await ResourceFiscalModel.sync({ force: false });
      await setupResourceFiscalSeq(sequelize, schemaName);
      await ResourceFiscalModel.create({
        account_rid: resourceData.account_id,
        resource_type_rid: resourceData.resource_type_rid,
        resource_rid: resourceId,
        resource_code: resourceData.resource_code,
        country_rid: resourceData.country_rid || null,
        country_region_rid: resourceData.region_rid || null,
        effective_date: moment(startDate).isValid()
          ? moment(startDate).toDate()
          : null,
        end_date: moment(endDate).isValid() ? moment(startDate).toDate() : null,
        created_by: resourceData.created_by || "",
      });
    } catch (err) {
      throw new Error(
        "Error inserting records into resources fiscal :" +
        (err as Error).message
      );
    }
  }

  async insertResourceFiscalRegionTable(
    sequelize: Sequelize,
    schemaName: string,
    resourceData: ICreateResource,
    resourceId: string,
    startDate: Moment,
    endDate: Moment
  ) {
    try {
      const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
        sequelize,
        schemaName
      );
      await ResourceFiscalRegionModel.sync({ force: false });
      await setupResourceFiscalRegionSeq(sequelize, schemaName);

      await ResourceFiscalRegionModel.create({
        account_rid: resourceData.account_id,
        resource_type_rid: resourceData.resource_type_rid,
        resource_code: resourceData.resource_code,
        resource_rid: resourceId,
        country_rid: resourceData.country_rid || null,
        country_region_rid: resourceData.region_rid || null,
        effective_date: moment(startDate).isValid()
          ? moment(startDate).toDate()
          : null,
        end_date: moment(endDate).isValid() ? moment(startDate).toDate() : null,
        created_by: resourceData.created_by || "",
      });
    } catch (err) {
      throw new Error(
        "Error inserting records into resources fiscal region :" +
        (err as Error).message
      );
    }
  }

  /**
   * Checks whether a resource exists by ID.
   * @param resourceId - Resource ID (RID).
   * @param accountNumber - Account number (schema).
   * @returns True if resource exists, false otherwise.
   */
  async checkIfResourceExists(
    resourceId: string,
    accountNumber: string
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!resourceId || !accountNumber) {
        throw new Error("Resource ID and account number are required");
      }

      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      // Verify schema exists before querying
      const schemaExists = await sequelize.query(
        rawQueries.getSchemaExistenceQuery(),
        {
          replacements: { schemaName },
          type: "SELECT",
        }
      );

      if (!schemaExists || (schemaExists as any[]).length === 0) {
        throw new Error(`Schema ${schemaName} does not exist`);
      }

      const Resource = Resources.initialize(sequelize, schemaName);

      // Add transaction to ensure data consistency
      const resource = await sequelize.transaction(async (t) => {
        return await Resource.findOne({
          where: {
            rid: resourceId,
          },
          transaction: t,
          lock: true,
        });
      });

      return resource !== null;
    } catch (err) {
      // Log error for debugging
      console.error("Resource existence check failed:", err);
      throw new Error(
        "Error checking if resource exists: " + (err as Error).message
      );
    }
  }

  /**
   * Updates an existing resource record.
   * @param resourceData - Updated resource data.
   * @param accountNumber - Account number (schema).
   * @param accountId - Account ID.
   * @returns Update result.
   */
  async updateResource(
    resourceData: IUpdateResource,
    accountNumber: string,
    accountId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);

      const isRefIdExist = await Resource.findOne({
        where: {
          resource_code: {
            [Op.iLike]: resourceData.resource_code,
          },
          rid: {
            [Op.ne]: resourceData.resource_id, // Exclude current resource being updated
          },
          account_rid: accountId,
        },
      });

      if (isRefIdExist) {
        throw new Error("Resource Code must be unique.");
      }

      // Parse dates and set to UTC midnight to avoid timezone issues
      const startDate = moment
        .utc(resourceData.effective_from_date, "YYYY-MM-DD")
        .startOf("day");
      const endDate = moment
        .utc(resourceData.effective_end_date, "YYYY-MM-DD")
        .startOf("day");

      const existingResourceData = await Resource.findOne({
        where: {
          rid: resourceData.resource_id,
        },
      });

      const updateResourceObject: any = {
        resource_name: resourceData.name || null,
        resource_code: resourceData.resource_code || null,
        resource_firstname: resourceData.first_name || null,
        resource_lastname: resourceData.last_name || null,
        resource_orgname: resourceData.org_name || null,
        resource_role: resourceData.role || null,
        resource_type_rid: resourceData.resource_type_rid || "",
        status_rid: resourceData.status_rid,
        country_rid: resourceData.country_rid || null,
        region_rid: resourceData.region_rid || null,
        city_rid: resourceData.city_rid || null,
        resource_startdate: moment(startDate).isValid()
          ? moment(startDate).toDate()
          : null,
        resource_enddate: moment(endDate).isValid()
          ? moment(endDate).toDate()
          : null,
        resource_designation: resourceData.resource_designation || null,
        resource_total_experience: resourceData.total_years_experience || null,
        resource_total_experience_organization:
          resourceData.total_years_in_org || null,
        modified_by: resourceData.modified_by,
        modified_datetime: moment().toDate(),
        comments: resourceData.comments || "",
      };

      const updateResource = await Resource.update(
        {
          ...updateResourceObject,
        },
        {
          where: {
            rid: resourceData.resource_id,
          },
        }
      );

      const userEventInfo: any = await this.fetchUserAndEventInfo({
        userId: resourceData.modified_by!,
        eventType: eventTypes.UI_HANDLER
      });
      await this.createAccountTimelineEntry(accountNumber!, {
        created_by: resourceData.modified_by!,
        account_rid: accountId,
        created_by_name: userEventInfo.full_name,
        entity_rid: resourceData.resource_id,
        entity_name: entityTypes.RESOURCE,
        event_type_rid: userEventInfo.event_type_rid,
        event_name: eventNames.UPDATE,
        descriptions: resourceData.resource_code
      }, ["account"]);

      // await this.updateResourceFiscal(
      //   resourceData,
      //   startDate,
      //   endDate,
      //   accountNumber
      // );

      // await this.updateResourceFiscalRegion(
      //   resourceData,
      //   startDate,
      //   endDate,
      //   accountNumber,
      //   accountId
      // );

      await this.updateResourceHistory(
        accountNumber,
        resourceData.resource_id,
        updateResourceObject,
        existingResourceData
      );

      await this.addTimeline(
        accountNumber,
        resourceData,
        resourceData.resource_id,
        "update",
        accountId
      );

      return updateResource;
    } catch (err) {
      errorLog("Error updating resource: " + (err as Error).message);
      throw new Error((err as Error).message);
    }
  }

  // async updateProjectResource(
  //   accountNumber: string,
  //   resourceData: IUpdateResource,
  //   existingResource: any,
  //   accountId: string
  // ) {
  //   const schemaName = `trd365_${accountNumber.replace(/\D/g, "")}`;
  //   const sequelize = await initOrgSequelize();

  //   const ProjectResourceModel = ProjectResource.initialize(
  //     sequelize,
  //     schemaName
  //   );
  //   const ProjectResourceFiscalModel = ProjectResourceFiscal.initialize(
  //     sequelize,
  //     schemaName
  //   );
  //   const ProjectResourceFiscalRegionModel =
  //     ProjectResourceFiscalRegion.initialize(sequelize, schemaName);

  //   const ResourceFiscalModel = ResourceFiscal.initialize(
  //     sequelize,
  //     schemaName
  //   );
  //   const ResourceFiscalRegionModel = ResourceFiscalRegion.initialize(
  //     sequelize,
  //     schemaName
  //   );

  //   const existingCode = existingResource?.resource_code;
  //   const newCode = resourceData?.resource_code;

  //   if (
  //     existingCode &&
  //     newCode &&
  //     existingCode.toLowerCase() !== newCode.toLowerCase()
  //   ) {
  //     const whereClause = {
  //       resource_code: existingCode,
  //       account_rid: accountId,
  //     };

  //     await Promise.all([
  //       ProjectResourceModel.update(
  //         { resource_code: newCode },
  //         { where: whereClause }
  //       ),
  //       ProjectResourceFiscalModel.update(
  //         { resource_code: newCode },
  //         { where: whereClause }
  //       ),
  //       ProjectResourceFiscalRegionModel.update(
  //         { resource_code: newCode },
  //         { where: whereClause }
  //       ),
  //       ResourceFiscalModel.update(
  //         { resource_code: newCode },
  //         { where: whereClause }
  //       ),
  //       ResourceFiscalRegionModel.update(
  //         { resource_code: newCode },
  //         { where: whereClause }
  //       ),
  //     ]);
  //   }
  // }

  async fetchExistingResource(accountNumber: string, resourceId: string) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
    const sequelize = await initOrgSequelize();

    const ResourcesModel = Resources.initialize(sequelize, schemaName);

    const resourceData = await ResourcesModel.findOne({
      where: {
        rid: resourceId,
      },
    });

    return resourceData;
  }

  /**
   * Updates the fiscal data of a resource.
   * @param resourceData - Updated resource data.
   * @param startDate - Start date (Moment).
   * @param endDate - End date (Moment).
   * @param accountNumber - Account number (schema).
   */
  async updateResourceFiscal(
    resourceData: IUpdateResource,
    startDate: Moment,
    endDate: Moment,
    accountNumber: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const ResourceFiscalModel = ResourceFiscal.initialize(
        sequelize,
        schemaName
      );
      await ResourceFiscalModel.update(
        {
          resource_type_rid: resourceData?.resource_type_rid || "",
          country_rid: resourceData.country_rid || null,
          country_region_rid: resourceData.region_rid || null,
          effective_date: moment(startDate).isValid()
            ? moment(startDate).toDate()
            : null,
          end_date: moment(endDate).isValid() ? moment(endDate).toDate() : null,
          modified_by: resourceData.modified_by || null,
        },
        {
          where: {
            resource_rid: resourceData.resource_id,
          },
        }
      );
    } catch (err) {
      throw new Error(
        "Error updating resource fiscal: " + (err as Error).message
      );
    }
  }

  async updateResourceFiscalRegion(
    resourceData: IUpdateResource,
    startDate: Moment,
    endDate: Moment,
    accountNumber: string,
    accountId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const ResourceFiscalRegionModel = ResourceFiscalRegion.initialize(
        sequelize,
        schemaName
      );
      await ResourceFiscalRegionModel.update(
        {
          resource_type_rid: resourceData.resource_type_rid || "",
          country_rid: resourceData.country_rid || null,
          country_region_rid: resourceData.region_rid || null,
          effective_date: moment(startDate).isValid()
            ? moment(startDate).toDate()
            : null,
          end_date: moment(endDate).isValid() ? moment(endDate).toDate() : null,
          modified_by: resourceData.modified_by || null,
          modified_datetime: new Date(),
        },
        {
          where: {
            account_rid: accountId,
            resource_code: resourceData.resource_code,
            country_region_rid: resourceData.region_rid,
          },
        }
      );
    } catch (err) {
      throw new Error(
        "Error updating resource fiscal: " + (err as Error).message
      );
    }
  }

  /**
   * Fetches the parent account number for a given parent account ID.
   * @param parentAccountId - Parent account RID.
   * @returns Parent account number.
   */
  async fetchParentAccount(parentAccountId: string): Promise<string> {
    try {
      const sequelize = await initMainDbSequelize();

      const [account]: any[] = await sequelize.query(
        rawQueries.fetchAccountDetailsByRid(parentAccountId),
        {
          type: "SELECT",
        }
      );

      return account?.r_number;
    } catch (err) {
      errorLog("Error fetching parent account : " + (err as Error).message);
      throw new Error(
        "Error fetching parent account : " + (err as Error).message
      );
    }
  }

  /**
   * Retrieves account metadata by account number.
   * @param accountNumber - Account number.
   * @returns Object with accountNumber and accountId.
   */
  async fetchAccountByNumber(accountNumber: string) {
    try {
      const sequelize = await initMainDbSequelize();

      let accountRnumber = accountNumber;

      const [account]: any[] = await sequelize.query(
        rawQueries.getAccountByNumberQuery(),
        {
          replacements: { r_number: accountNumber },
          type: "SELECT",
        }
      );

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await sequelize.query(
          rawQueries.fetchAccountById,
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
        accountName: account.account_name,
      };
    } catch (err) {
      errorLog("Error fetching account : " + (err as Error).message);
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  /**
   * Logs history of changes made to a resource.
   * @param accountNumber - Account number (schema).
   * @param resourceId - Resource ID (RID).
   * @param newResourceData - Updated data.
   * @param existingResourceData - Existing resource data.
   */
  async updateResourceHistory(
    accountNumber: string,
    resourceId: string,
    newResourceData: any,
    existingResourceData: any
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const ResourcesHistoryModel = await ResourcesHistory.initialize(
        sequelize,
        schemaName
      );

      const excludedFields = ["created_by", "modified_by", "account_rid"];

      const cleanedNewData = Object.fromEntries(
        Object.entries(newResourceData).filter(
          ([key]) => !excludedFields.includes(key)
        )
      );

      const historyChanges = Object.entries(cleanedNewData)
        .filter(([key, newValue]) => {
          const oldValue = existingResourceData[key];
          const data =
            key === "cost"
              ? parseFloat(JSON.stringify(newValue)).toFixed(2)
              : newValue;
          return String(data ?? "") !== String(oldValue ?? "");
        })
        .map(([key, newValue], index) => ({
          resource_rid: resourceId,
          attribute_name: key,
          old_value:
            existingResourceData[key] !== null &&
              existingResourceData[key] !== undefined
              ? String(existingResourceData[key])
              : "",
          new_value:
            newValue !== null && newValue !== undefined ? String(newValue) : "",
          created_by:
            newResourceData.modified_by ||
            newResourceData.created_by ||
            "system",
          r_number: "",
        }));

      if (historyChanges.length === 0) return;

      const latest = await ResourcesHistoryModel.findAll();

      historyChanges.forEach((change, i) => {
        change.r_number = `RESH${(latest.length + i + 1)
          .toString()
          .padStart(4, "0")}`;
      });

      await ResourcesHistoryModel.bulkCreate(historyChanges);
    } catch (err) {
      throw new Error(
        "Error updating resource history : " + (err as Error).message
      );
    }
  }

  /**
   * Fetches detailed resource data by ID and enriches with country, currency, and region names.
   * @param accountNumber - Account number (schema).
   * @param resourceId - Resource RID.
   * @returns Enriched resource object.
   */
  async resourceDetails(accountNumber: string, resourceId: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const mainDbSequelize = await initMainDbSequelize();

      const ResourcesModel = await Resources.initialize(sequelize, schemaName);

      let resource: any = await ResourcesModel.findOne({
        where: {
          rid: resourceId,
        },
      });

      if (resource) {
        const [country]: any[] = await mainDbSequelize.query(
          rawQueries.fetchCountryById(),
          {
            replacements: { id: resource.country_rid },
            type: "SELECT",
          }
        );
        const [state]: any[] = await mainDbSequelize.query(
          rawQueries.fetchStateById(),
          {
            replacements: { id: resource.region_rid },
            type: "SELECT",
          }
        );
        const [city]: any[] = await mainDbSequelize.query(
          rawQueries.fetchCityById(),
          {
            replacements: { id: resource.city_rid },
            type: "SELECT",
          }
        );
        const [resource_type]: any[] = await mainDbSequelize.query(
          rawQueries.fetchSpecificResourceTypeById(),
          {
            replacements: { resourceTypeId: resource.resource_type_rid },
            type: "SELECT",
          }
        );
        const [status]: any[] = await mainDbSequelize.query(
          rawQueries.fetchStatusById(),
          {
            replacements: { rid: resource.status_rid },
            type: "SELECT",
          }
        );

        (resource as any).dataValues.country_code =
          country?.country_code || null;
        (resource as any).dataValues.country_name =
          country?.country_name || null;
        (resource as any).dataValues.region_name = state?.state_name || null;
        (resource as any).dataValues.city_name = city?.city_name || null;
        (resource as any).dataValues.resource_type_name =
          resource_type?.resource_type_name || null;
        (resource as any).dataValues.status_name = status?.status_name || null;
        //Added to format date as yyyy-mm-dd
        resource = {
          ...resource.toJSON(),
          resource_startdate: resource.resource_startdate
            ? moment(resource.resource_startdate).format("YYYY-MM-DD")
            : null,
          resource_enddate: resource.resource_enddate
            ? moment(resource.resource_enddate).format("YYYY-MM-DD")
            : null,
        };
      }

      return resource;
    } catch (err) {
      throw new Error(
        "Error fetching resource details : " + (err as Error).message
      );
    }
  }

  /**
   * Adds an event to the resource timeline (e.g., create/update).
   * @param accountNumber - Account number.
   * @param resourceData - Resource data object.
   * @param resourceId - Resource RID.
   * @param eventName - Event name ('create', 'update', etc).
   * @param accountId - Account RID.
   */
  async addTimeline(
    accountNumber: string,
    resourceData: any,
    resourceId: string,
    eventName: string,
    accountId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();
      const ResourcesTimelineModel = await ResourcesTimeline.initialize(
        sequelize,
        schemaName
      );

      await ResourcesTimelineModel.create({
        account_rid: accountId,
        event_name: eventName,
        event_status: "success",
        event_type: "ui handler",
        entity_rid: resourceId,
        created_by: resourceData.created_by || resourceData.modified_by,
      });
    } catch (err) {
      throw new Error("Error adding timeline : " + (err as Error).message);
    }
  }

  async insertGeoData(resources: any, mainDdSequilze: Sequelize) {
    try {
      const countryIds = [
        ...new Set(resources.map((r: any) => r.country_rid)),
      ].filter(Boolean);
      const regionIds = [
        ...new Set(resources.map((r: any) => r.region_rid)),
      ].filter(Boolean);
      const cityIds = [
        ...new Set(resources.map((r: any) => r.city_rid)),
      ].filter(Boolean);
      const resourceTypeRids = [
        ...new Set(resources.map((r: any) => r.resource_type_rid)),
      ].filter(Boolean);
      const statusRids = [
        ...new Set(resources.map((r: any) => r.status_rid)),
      ].filter(Boolean);

      let countryRows: any[] = [];
      let states: any[] = [];
      let cities: any[] = [];
      let resourceType: any[] = [];
      let status: any[] = [];

      if (countryIds.length > 0) {
        countryRows = await mainDdSequilze.query(
          rawQueries.GET_COUNTRIES,
          {
            replacements: { countryRid: countryIds },
            type: "SELECT",
          }
        );
      }

      if (regionIds.length > 0) {
        states = await mainDdSequilze.query(
          rawQueries.GET_REGIONS,
          {
            replacements: { regionRid: regionIds },
            type: "SELECT",
          }
        );
      }

      if (cityIds.length > 0) {
        cities = await mainDdSequilze.query(
          rawQueries.GET_CITIES,
          {
            replacements: { ids: cityIds },
            type: "SELECT",
          }
        );
      }
      if (resourceTypeRids.length > 0) {
        resourceType = await mainDdSequilze.query(
          rawQueries.GET_RESOURCE_TYPES,
          {
            replacements: { resourceTypeRid: resourceTypeRids },
            type: "SELECT",
          }
        );
      }
      if (statusRids.length > 0) {
        status = await mainDdSequilze.query(
          rawQueries.GET_STATUSES,
          {
            replacements: { statusRid: statusRids },
            type: "SELECT",
          }
        );
      }

      const countryMap = Object.fromEntries(
        (Array.isArray(countryRows) ? countryRows : []).map((c: any) => [
          c.rid,
          c,
        ])
      );

      const regionMap = Object.fromEntries(
        (Array.isArray(states) ? states : []).map((s: any) => [s.rid, s])
      );

      const cityMap = Object.fromEntries(
        (Array.isArray(cities) ? cities : []).map((s: any) => [s.rid, s])
      );

      const resourceTypeMap = Object.fromEntries(
        (Array.isArray(resourceType) ? resourceType : []).map((s: any) => [
          s.rid,
          s,
        ])
      );
      const statusMap = Object.fromEntries(
        (Array.isArray(status) ? status : []).map((s: any) => [s.rid, s])
      );

      const updatedResources = resources.map((res: any) => ({
        ...res.toJSON(),
        country_name: countryMap[res.country_rid]?.country_name || null,
        region_name: regionMap[res.region_rid]?.state_name || null,
        city_name: cityMap[res.city_rid]?.city_name || null,
        resource_type_name:
          resourceTypeMap[res.resource_type_rid]?.resource_type_name || null,
        status_name: statusMap[res.status_rid]?.status_name || null,
      }));

      return updatedResources;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async sortGeoData(resources: any[], order: string[][] = []): Promise<any[]> {
    // Apply sorting if specified
    if (order && order.length > 0) {
      const [sortField, rawSortDirection] = order?.[0] ?? [];
      const sortDirection = rawSortDirection ?? "ASC";
      const isAsc = sortDirection.toUpperCase() === "ASC";
      resources = resources.sort((a, b) => {
        let compareValueA, compareValueB;

        switch (sortField) {
          case "country_rid":
            compareValueA = a.country_name || null;
            compareValueB = b.country_name || null;
            break;
          case "region_rid":
            compareValueA = a.region_name || null;
            compareValueB = b.region_name || null;
            break;
          case "resource_type_rid":
            compareValueA = a.resource_type_name || null;
            compareValueB = b.resource_type_name || null;
            break;
          case "status_name":
            compareValueA = a.status_name || null;
            compareValueB = b.status_name || null;
            break;
          default:
            return 0;
        }

        // Handle null/empty values
        if (compareValueA === null && compareValueB === null) return 0;
        if (compareValueA === null) return isAsc ? 1 : -1;
        if (compareValueB === null) return isAsc ? -1 : 1;

        // Compare non-null values
        if (isAsc) {
          return compareValueA.localeCompare(compareValueB);
        } else {
          return compareValueB.localeCompare(compareValueA);
        }
      });
    }

    return resources;
  }

  applyTextFilter(value: string | null | undefined, filter: any): boolean {
    const val = (value || "").toLowerCase();

    if (filter?.contains && !val.includes(filter.contains.toLowerCase())) {
      return false;
    }

    if (
      filter?.not_contains &&
      val.includes(filter.not_contains.toLowerCase())
    ) {
      return false;
    }

    if (filter?.equals && val !== filter.equals.toLowerCase()) {
      return false;
    }

    if (filter?.not_equals && val === filter.not_equals.toLowerCase()) {
      return false;
    }

    if (
      filter?.is_empty === true &&
      val.trim() !== "" &&
      !val.trim() !== null
    ) {
      return false;
    }

    return true;
  }

  async insertProjectGeoData(project: any, mainDdSequilze: Sequelize) {
    try {
      const countryId = project.country_rid;
      const regionId = project.region_rid;
      const currencyId = project.currency_rid;

      let countryRow: any = null;
      let regionRow: any = null;
      let currencyRow: any = null;

      if (countryId) {
        const result = await mainDdSequilze.query(
          rawQueries.fetchCountryById(),
          {
            replacements: { id: countryId },
            type: "SELECT",
          }
        );
        countryRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      if (regionId) {
        const result = await mainDdSequilze.query(
          rawQueries.fetchStateById(),
          {
            replacements: { id: regionId },
            type: "SELECT",
          }
        );
        regionRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      if (currencyId) {
        const result = await mainDdSequilze.query(
          rawQueries.fetchCurrencyById(),
          {
            replacements: { id: currencyId },
            type: "SELECT",
          }
        );
        currencyRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      project = {
        ...project,
        country_name: countryRow?.country_name || null,
        country_code: countryRow?.country_code || null,
        region_name: regionRow?.state_name || null,
        currency_name: currencyRow?.currency_code || null,
        currency_symbol: currencyRow?.currency_symbol || null,
      };

      return project;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async fetchAccountById(accountId: string) {
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

  async fetchValidAccountNumberById(accountId: string) {
    try {

      const mainDbSequelize = await initMainDbSequelize();

      const [account]: any[] = await mainDbSequelize.query(
        rawQueries.fetchAccountById,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );

      let accountRnumber = account?.r_number;

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await mainDbSequelize.query(
          rawQueries.fetchAccountById,
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
      };
    } catch (err) {
      throw new Error("Error fetching account : " + (err as Error).message);
    }
  }

  async addProjectResourceExistsFlags(projects: any[]): Promise<any[]> {
    const orgDb = await initOrgSequelize();
    const checkPromises: Promise<void>[] = [];

    for (const project of projects) {
      const { accountNumber } =
        await this.fetchValidAccountNumberById(project.account_rid);
      const schemaName = rawQueries.fetchSchemaName(accountNumber);

      if (project.ProjectFiscal && project.ProjectFiscal.length > 0) {
        for (const fiscal of project.ProjectFiscal) {
          try {
            // Check if table exists
            const checkTable: any = await orgDb.query(`
              SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = '${schemaName}'
                  AND table_name = 'project_resource'
              ) AS table_exists;
            `);

            const tableExists = checkTable[0][0].table_exists;

            if (tableExists) {
              const query = checkProjectMappedToProjectRes(schemaName, fiscal.project_fiscal_rid);

              const promise = orgDb
                .query(query)
                .then((result: any) => {
                  fiscal.is_project_exists = result[0]?.length > 0;
                })
                .catch((error) => {
                  console.error(`Error checking project resource for fiscal ${fiscal.project_fiscal_rid}:`, error);
                  fiscal.is_project_exists = false;
                });

              checkPromises.push(promise);
            } else {
              // Table doesn't exist, set flag to false
              fiscal.is_project_exists = false;
            }
          } catch (error) {
            console.error(`Error checking table existence for schema ${schemaName}:`, error);
            fiscal.is_project_exists = false;
          }
        }
      }
    }

    await Promise.all(checkPromises);
    return projects;
  }

  async fetchAllProjects(
    offset: number,
    limit: number,
    sort: { sortCol: string; sortOrder: string },
    whereClause: Record<string, any>,
    fiscalYear: number,
    accountMeta: string[],
    userId: string,
    search: string,
    accountDataSort: string[][],
    bothParentAndChild: boolean,
    accessibleIds: string[]
  ) {
    try {
      const mainDbSequelize = await initMainDbSequelize();
      const MAIN_SCHEMA_NAME = "trd365";
      const replacements: any[] = [];

      // 1. Sort configuration
      const sortColumnMap: Record<string, { parent: string; child: string }> = {
        r_number: { parent: "r_number", child: "r_number" },
        project_r_number: {
          parent: "project_r_number",
          child: "project_r_number",
        },
        project_name: { parent: "project_name", child: "project_name" },
        account_name: { parent: "account_name", child: "account_name" },
        industry_name: {
          parent: "industry_name_other",
          child: "industry_name",
        },
        project_type_name: {
          parent: "project_type_name",
          child: "project_type_name",
        },
        project_code: { parent: "project_code", child: "project_code" },
        project_group: { parent: "project_group", child: "project_group" },
        project_client_group: {
          parent: "project_client_group",
          child: "project_client_group",
        },
        total_effort: { parent: "total_effort", child: "total_effort" },
        total_cost: { parent: "total_cost", child: "total_cost" },
        total_cost_fte: { parent: "total_cost_fte", child: "total_cost_fte" },
        total_cost_subcon: {
          parent: "total_cost_subcon",
          child: "total_cost_subcon",
        },
        total_cost_nonlabor: {
          parent: "total_cost_nonlabor",
          child: "total_cost_nonlabor",
        },
        classification_name: {
          parent: "classification_name",
          child: "classification_name",
        },
        status_name: { parent: "status_name", child: "status_name" },
        country_name: { parent: "country_name", child: "country_name" },
        region_name: { parent: "region_name", child: "region_name" },
        project_startdate: {
          parent: "project_startdate",
          child: "project_startdate",
        },
        project_enddate: {
          parent: "project_enddate",
          child: "project_enddate",
        },
        modified_datetime: {
          parent: "modified_datetime",
          child: "modified_datetime",
        },
        created_datetime: {
          parent: "created_datetime",
          child: "created_datetime",
        },
        project_point_of_contact: {
          parent: "project_point_of_contact",
          child: "project_point_of_contact",
        },
        project_point_of_contact_email: {
          parent: "project_point_of_contact_email",
          child: "project_point_of_contact_email",
        },
        technical_point_of_contact: {
          parent: "technical_point_of_contact",
          child: "technical_point_of_contact",
        },
        technical_point_of_contact_email: {
          parent: "technical_point_of_contact_email",
          child: "technical_point_of_contact_email",
        },
        fiscal_year: { parent: "", child: "fiscal_year" },
        qre_final: { parent: "", child: "qre_final" },
        qre: { parent: "qre", child: "qre" },
        rd_percent_final: { parent: "", child: "rd_percent_final" },
        assessment_status: {
          parent: "assessment_status",
          child: "assessment_status",
        },
        is_assesed: { parent: "", child: "is_assesed" },
        comments: { parent: "comments", child: "comments" },
      };

      const sortConfig = sortColumnMap[sort.sortCol] || {
        parent: sort.sortCol,
        child: sort.sortCol,
      };
      const isChildOnlySort =
        sort.sortCol === "fiscal_year" || sort.sortCol === "qre_final" || sort.sortCol === "rd_percent_final" || sort.sortCol === "is_assesed";

      let parentSortClause = "";
      if (isChildOnlySort) {
        // Child-only fields exist only in project_fiscal_summary, not project_summary.
        // Sort the outer query by extracting from the ProjectFiscal JSON array.
        const childSortCastMap: Record<string, string> = {
          fiscal_year: "::int",
          qre_final: "::numeric",
          rd_percent_final: "::numeric",
          is_assesed: "::boolean",
        };
        const cast = childSortCastMap[sort.sortCol] || "";
        parentSortClause = `ORDER BY ("ProjectFiscal"->0->>'${sort.sortCol}')${cast} ${sort.sortOrder} NULLS LAST`;
      } else if (bothParentAndChild && sortConfig.parent) {
        parentSortClause = `ORDER BY ${sortConfig.parent} ${sort.sortOrder}`;
      }

      const childSortClause =
        (!bothParentAndChild || isChildOnlySort || bothParentAndChild) &&
          sortConfig.child
          ? `ORDER BY pfs_sub.${sort.sortCol} ${sort.sortOrder}`
          : "";

      // 2. Build where clauses
      const {
        whereSQL: filterWhereSQLParent,
        replacements: whereReplacementsParent,
      } = bothParentAndChild
          ? this.buildRawWhereClause(whereClause, search, true)
          : { whereSQL: "", replacements: [] };

      const {
        whereSQL: filterWhereSQLChild,
        replacements: whereReplacementsChild,
      } = this.buildRawWhereClause(whereClause, search, false);

      replacements.push(...whereReplacementsParent, ...whereReplacementsChild);

      // 3. Fiscal year handling
      const fiscalYearClause =
        fiscalYear && fiscalYear !== 0 ? `AND pfs.fiscal_year = ?` : "";

      // 4. Common SQL fragments
      const commonSelectFields = rawQueries.getCommonProjectSelectFields();

      const commonJoins = rawQueries.getCommonProjectJoins();

      const commonGroupBy = rawQueries.getCommonProjectGroupBy();
      const includeProjectFilter = accessibleIds.length > 0;
      const accessibleProjectsCondition = includeProjectFilter
        ? `pfs.project_fiscal_rid = ANY(ARRAY[?]::text[])`
        : "1=1";

      // 5. Get project IDs first - Modified to include all projects when bothParentAndChild is true
      const accountMetaClause =
        accountMeta.length > 0 ? `AND acc.rid = ANY(ARRAY[?]::text[])` : "";

      const projectIdsQuery = bothParentAndChild
        ? `
        SELECT DISTINCT ps.project_rid
        FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
        INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ps.account_rid
        INNER JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs 
          ON pfs.project_rid = ps.project_rid 
          AND pfs.account_rid = ps.account_rid
        WHERE ${accessibleProjectsCondition}
        ${filterWhereSQLParent ? `AND ${filterWhereSQLParent}` : ""}
        ${accountMetaClause}
        ${fiscalYearClause}
      `
        : `
        SELECT DISTINCT ps.project_rid
        FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
        INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ps.account_rid
        INNER JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs 
          ON pfs.project_rid = ps.project_rid 
          AND pfs.account_rid = ps.account_rid
        WHERE ${accessibleProjectsCondition}
        ${filterWhereSQLChild ? `AND ${filterWhereSQLChild}` : ""}
        ${accountMetaClause}
        ${fiscalYearClause}
      `;

      const projectIdsReplacements = bothParentAndChild
        ? [
          ...(accessibleIds.length > 0 ? [accessibleIds] : []),
          ...whereReplacementsParent,
          ...(accountMeta.length > 0 ? [accountMeta] : []),
          ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ]
        : [
          ...(accessibleIds.length > 0 ? [accessibleIds] : []),
          ...whereReplacementsChild,
          ...(accountMeta.length > 0 ? [accountMeta] : []),
          ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ];
      const projectIdsResult = await mainDbSequelize.query(projectIdsQuery, {
        replacements: projectIdsReplacements,
        type: "SELECT",
      });

      const projectIds = projectIdsResult.map((row: any) => row.project_rid);
      const totalCount = projectIds.length;

      if (projectIds.length === 0) {
        return { finalResult: [], totalCount: 0 };
      }

      // 6. Main query with proper parameter ordering and bothParentAndChild logic
      const childAggSQL = rawQueries.getChildAggregationSQL(childSortClause, fiscalYearClause, filterWhereSQLChild);

      const fullQuery = `
        WITH base_projects AS (
          SELECT ${commonSelectFields},
          ${childAggSQL}
          ${commonJoins}
          WHERE ps.project_rid IN (${projectIds.map(() => "?").join(",")})
          ${accountMeta.length > 0
          ? `AND acc.rid IN (${accountMeta.map(() => "?").join(",")})`
          : ""
        }
          ${commonGroupBy}
        )
        SELECT * FROM base_projects
        ${parentSortClause}
        LIMIT ? OFFSET ?
      `;

      const finalReplacements = [
        // For childAggSQL
        ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ...whereReplacementsChild,

        // For main query
        ...projectIds,
        ...(accountMeta.length > 0 ? accountMeta : []),

        // Pagination
        limit,
        offset,
      ];

      const results = await mainDbSequelize.query(fullQuery, {
        replacements: finalReplacements,
        type: "SELECT",
      });

      return {
        finalResult: results,
        totalCount,
      };
    } catch (err) {
      console.error("Error in fetchAllProjects:", err);
      throw new Error("Error fetching Projects: " + (err as Error).message);
    }
  }

  async fetchAllProjectsForExport(
    sort: { sortCol: string; sortOrder: string },
    whereClause: Record<string, any>,
    fiscalYear: number,
    accountMeta: string[],
    userId: string,
    search: string,
    accountDataSort: string[][],
    bothParentAndChild: boolean,
    accessibleIds: string[]
  ) {
    try {
      const mainDbSequelize = await initMainDbSequelize();
      const MAIN_SCHEMA_NAME = "trd365";
      const replacements: any[] = [];

      // 1. Sort configuration
      const sortColumnMap: Record<string, { parent: string; child: string }> = {
        r_number: { parent: "r_number", child: "r_number" },
        project_r_number: {
          parent: "project_r_number",
          child: "project_r_number",
        },
        project_name: { parent: "project_name", child: "project_name" },
        account_name: { parent: "account_name", child: "account_name" },
        industry_name: {
          parent: "industry_name_other",
          child: "industry_name",
        },
        project_type_name: {
          parent: "project_type_name",
          child: "project_type_name",
        },
        project_code: { parent: "project_code", child: "project_code" },
        project_group: { parent: "project_group", child: "project_group" },
        project_client_group: {
          parent: "project_client_group",
          child: "project_client_group",
        },
        total_effort: { parent: "total_effort", child: "total_effort" },
        total_cost: { parent: "total_cost", child: "total_cost" },
        total_cost_fte: { parent: "total_cost_fte", child: "total_cost_fte" },
        total_cost_subcon: {
          parent: "total_cost_subcon",
          child: "total_cost_subcon",
        },
        total_cost_nonlabor: {
          parent: "total_cost_nonlabor",
          child: "total_cost_nonlabor",
        },
        classification_name: {
          parent: "classification_name",
          child: "classification_name",
        },
        status_name: { parent: "status_name", child: "status_name" },
        country_name: { parent: "country_name", child: "country_name" },
        region_name: { parent: "region_name", child: "region_name" },
        project_startdate: {
          parent: "project_startdate",
          child: "project_startdate",
        },
        project_enddate: {
          parent: "project_enddate",
          child: "project_enddate",
        },
        modified_datetime: {
          parent: "modified_datetime",
          child: "modified_datetime",
        },
        created_datetime: {
          parent: "created_datetime",
          child: "created_datetime",
        },
        project_point_of_contact: {
          parent: "project_point_of_contact",
          child: "project_point_of_contact",
        },
        technical_point_of_contact: {
          parent: "technical_point_of_contact",
          child: "technical_point_of_contact",
        },
        fiscal_year: { parent: "", child: "fiscal_year" },
        qre_final: { parent: "", child: "qre_final" },
        qre: { parent: "qre", child: "qre" },
        is_assesed: { parent: "", child: "is_assesed" },
        assessment_status: {
          parent: "assessment_status",
          child: "assessment_status",
        },
        comments: { parent: "comments", child: "comments" },
      };

      const sortConfig = sortColumnMap[sort.sortCol] || {
        parent: sort.sortCol,
        child: sort.sortCol,
      };
      const isChildOnlySort =
        sort.sortCol === "fiscal_year" || sort.sortCol === "qre_final" || sort.sortCol === "is_assesed";

      const parentSortClause =
        bothParentAndChild && sortConfig.parent
          ? `ORDER BY ${sortConfig.parent} ${sort.sortOrder}`
          : "";

      const childSortClause =
        (!bothParentAndChild || isChildOnlySort || bothParentAndChild) &&
          sortConfig.child
          ? `ORDER BY pfs_sub.${sort.sortCol} ${sort.sortOrder}`
          : "";

      // 2. Build where clauses
      const {
        whereSQL: filterWhereSQLParent,
        replacements: whereReplacementsParent,
      } = bothParentAndChild
          ? this.buildRawWhereClause(whereClause, search, true)
          : { whereSQL: "", replacements: [] };

      const {
        whereSQL: filterWhereSQLChild,
        replacements: whereReplacementsChild,
      } = this.buildRawWhereClause(whereClause, search, false);

      replacements.push(...whereReplacementsParent, ...whereReplacementsChild);

      // 3. Fiscal year handling
      const fiscalYearClause =
        fiscalYear && fiscalYear !== 0 ? `AND pfs.fiscal_year = ?` : "";

      // 4. Common SQL fragments
      const commonSelectFields = rawQueries.getCommonProjectSelectFields();

      const commonJoins = rawQueries.getCommonProjectJoins();

      const commonGroupBy = rawQueries.getCommonProjectGroupBy();

      // 5. Get project IDs first - Modified to include all projects when bothParentAndChild is true
      const includeProjectFilter = accessibleIds.length > 0;
      const accessibleProjectsCondition = includeProjectFilter
        ? `ps.project_rid = ANY(ARRAY[?]::text[])`
        : "1=1";

      const accountMetaClause =
        accountMeta.length > 0 ? `AND acc.rid = ANY(ARRAY[?]::text[])` : "";

      const projectIdsQuery = bothParentAndChild
        ? `
        SELECT DISTINCT ps.project_rid
        FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
        INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ps.account_rid
        INNER JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs 
          ON pfs.project_rid = ps.project_rid 
          AND pfs.account_rid = ps.account_rid
        WHERE ${accessibleProjectsCondition}
        ${filterWhereSQLParent ? `AND ${filterWhereSQLParent}` : ""}
        ${accountMetaClause}
        ${fiscalYearClause}
      `
        : `
        SELECT DISTINCT ps.project_rid
        FROM ${MAIN_SCHEMA_NAME}.project_summary AS ps
        INNER JOIN ${MAIN_SCHEMA_NAME}.account acc ON acc.rid = ps.account_rid
        INNER JOIN ${MAIN_SCHEMA_NAME}.project_fiscal_summary pfs 
          ON pfs.project_rid = ps.project_rid 
          AND pfs.account_rid = ps.account_rid
        WHERE ${accessibleProjectsCondition}
        ${filterWhereSQLChild ? `AND ${filterWhereSQLChild}` : ""}
        ${accountMetaClause}
        ${fiscalYearClause}
      `;

      const projectIdsReplacements = bothParentAndChild
        ? [
          ...(accessibleIds.length > 0 ? [accessibleIds] : []),
          ...whereReplacementsParent,
          ...(accountMeta.length > 0 ? [accountMeta] : []),
          ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ]
        : [
          ...(accessibleIds.length > 0 ? [accessibleIds] : []),
          ...whereReplacementsChild,
          ...(accountMeta.length > 0 ? [accountMeta] : []),
          ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ];

      const projectIdsResult = await mainDbSequelize.query(projectIdsQuery, {
        replacements: projectIdsReplacements,
        type: "SELECT",
      });

      const projectIds = projectIdsResult.map((row: any) => row.project_rid);
      const totalCount = projectIds.length;

      if (projectIds.length === 0) {
        return { finalResult: [], totalCount: 0 };
      }

      // 6. Main query with proper parameter ordering and bothParentAndChild logic
      const childAggSQL = rawQueries.getChildAggSQL(
        childSortClause,
        fiscalYearClause,
        filterWhereSQLChild
      );

      const fullQuery = `
        WITH base_projects AS (
          SELECT ${commonSelectFields},
          ${childAggSQL}
          ${commonJoins}
          WHERE ps.project_rid IN (${projectIds.map(() => "?").join(",")})
          ${accountMeta.length > 0
          ? `AND acc.rid IN (${accountMeta.map(() => "?").join(",")})`
          : ""
        }
          ${commonGroupBy}
        )
        SELECT * FROM base_projects
        ${parentSortClause}
      `;

      const finalReplacements = [
        // For childAggSQL
        ...(fiscalYear && fiscalYear !== 0 ? [fiscalYear] : []),
        ...whereReplacementsChild,

        // For main query
        ...projectIds,
        ...(accountMeta.length > 0 ? accountMeta : []),
      ];

      const results = await mainDbSequelize.query(fullQuery, {
        replacements: finalReplacements,
        type: "SELECT",
      });

      return {
        finalResult: results,
        totalCount,
      };
    } catch (err) {
      console.error("Error in fetchAllProjects:", err);
      throw new Error("Error fetching Projects: " + (err as Error).message);
    }
  }

  async computeGlobalAccountFilter(globalFilters: Record<string, string[]>) {
    try {
      const result = [];

      for (const key of Object.keys(globalFilters)) {
        const values = globalFilters[key] ?? [];
        result.push(key, ...values);
      }

      return result;
    } catch (err) {
      throw new Error("Error computing global account filter");
    }
  }

  async manageKeyContacts(
    key_contacts: IKeyContactDetail,
    projectId: string,
    userId: string,
    schemaName: string
  ) {
    try {
      const sequelize = await initOrgSequelize();
      const keyContactModel = await KeyContact.initialize(
        sequelize,
        schemaName
      );

      for (const contact of Object.values(key_contacts)) {
        if (contact.action_type === "edit") {
          if (
            contact.key_contact_name ||
            contact.key_contact_email ||
            contact.key_contact_role_rid
          ) {
            this.updateKeyContactDetails(contact, userId, keyContactModel);
          }
        } else if (contact.action_type === "delete") {
          {
            this.deleteKeyContactDetails(
              contact.rid,
              projectId,
              keyContactModel
            );
          }
        } else if (contact.action_type === "add") {
          if (
            contact.key_contact_name ||
            contact.key_contact_email ||
            contact.key_contact_role_rid
          ) {
            this.insertKeyContactDetails(
              keyContactModel,
              contact,
              projectId,
              userId
            );
          }
        }
      }
    } catch (Error) {
      console.log(Error);
    }
  }
  async deleteKeyContactDetails(
    key_contact_id: string,
    project_rid: string,
    KeyContactModel: any
  ) {
    await KeyContactModel.destroy({
      where: {
        rid: key_contact_id,
      },
    });
  }
  async updateKeyContactDetails(
    key_contact: IUpdateKeyContactDetail,
    userId: string,
    KeyContact: any
  ) {
    try {
      const keyContactDetails = key_contact;

      await KeyContact.update(
        {
          key_contact_name: keyContactDetails.key_contact_name || null,
          key_contact_email: keyContactDetails.key_contact_email || null,
          key_contact_role: keyContactDetails.key_contact_role || null,
          status_rid: keyContactDetails.status_rid || "Active",
          interaction_cc_recipient:
            keyContactDetails.interaction_cc_recipient === null
              ? null
              : keyContactDetails.interaction_cc_recipient,
          is_primary_contact:
            keyContactDetails.is_primary_contact === null
              ? null
              : keyContactDetails.is_primary_contact,
          include_in_communication:
            keyContactDetails.is_primary_contact === null
              ? null
              : keyContactDetails.is_primary_contact,
          modified_by: userId,
        },
        {
          where: {
            rid: keyContactDetails.rid,
          },
        }
      );
    } catch (error) {
      console.error("Error updating key contact details:", error);
      throw error;
    }
  }

  async insertKeyContactDetails(
    KeyContactModel: any,
    keyContacts: IKeyContactDetail,
    project_rid: string,
    userId: string
  ) {
    try {
      const keyContactDetails = keyContacts;
      await KeyContactModel.create({
        key_contact_name: keyContactDetails.key_contact_name || null,
        key_contact_email: keyContactDetails.key_contact_email || null,
        key_contact_role: keyContactDetails.key_contact_role || null,
        status_rid: keyContactDetails.status_rid || null,
        interaction_cc_recipient: keyContactDetails.interaction_cc_recipient || null,
        is_primary_contact: keyContactDetails.is_primary_contact || null,
        include_in_communication:
          keyContactDetails.include_in_communication || null,
        entity_rid: project_rid,
        created_by: userId,
        entity_type: "Project",
      });
    } catch (error) {
      console.error("Error inserting key contact details:", error);
      throw error;
    }
  }

  async fetchKeyContacts(project_rid: string, KeyContactModel: any) {
    try {
      return await KeyContactModel.findOne({
        entity_rid: project_rid,
        entity_type: "Project",
      });
    } catch (err) {
      throw new Error("Error fetching key contact");
    }
  }

  async checkIfSchemaAndTableExists(accountNumber: string) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await initOrgSequelize();

      const result = await sequelize.query(
        rawQueries.getCheckTableExistsQuery(),
        {
          replacements: { schemaName },
          type: "SELECT",
        }
      );

      return (result[0] as any).exists === true;
    } catch (err) {
      errorLog("Error checking schema", (err as Error).message);
      throw new Error("Error checking schema :" + (err as Error).message);
    }
  }
  async fetchSchemaByUserId(userId: string) {
    try {
      const mainDbInstance = await initMainDbSequelize();

      let account: any[] = await mainDbInstance.query(
        rawQueries.getAccountListQuery(),
        {
          replacements: { created_by: userId },
          type: "SELECT",
        }
      );

      if (account && account.length > 0) {
        account.forEach((acc) => {
          if (acc.storage_type === "store_in_parent") {
            const findParentAccId = account.filter(
              (val) => val.rid === acc.parent_account_rid
            );
            if (findParentAccId && findParentAccId.length > 0) {
              acc.r_number = findParentAccId[0].r_number;
            }
          }
        });
      }

      return account;
    } catch (err) {
      throw new Error("Error fecthing schema" + (err as Error).message);
    }
  }

  buildRawWhereClause(
    where: Record<string, any>,
    search: string,
    isParent: boolean
  ) {
    const tablePrefix = isParent ? "ps" : "pfs";

    const fieldAliasMap: Record<string, string> = {
      r_number: `${tablePrefix}.r_number`,
      project_r_number: `${tablePrefix}.project_r_number`,
      comments: `${tablePrefix}.comments`,
      region_rid: "st.rid",
      currency_rid: "curr.rid",
      country_rid: "cou.rid",
      industry_name: `COALESCE(${tablePrefix}.industry_name, ind.industry_name)`,
      industry_name_other: `COALESCE(${tablePrefix}.industry_name, ind.industry_name)`,
      modified_datetime: `${tablePrefix}.modified_datetime`,
      classification_name: `COALESCE(${tablePrefix}.project_classification_other, pc.classification_name)`,
      account_name: `acc.account_name`,
      project_group: `${tablePrefix}.project_group`,
      project_client_group: `${tablePrefix}.project_client_group`,
      project_classification_rid: `${tablePrefix}.project_classification_rid`,
      project_classification_other: `${tablePrefix}.project_classification_other`,
      status_rid: `${tablePrefix}.status_rid`,
      project_type_rid: `${tablePrefix}.project_type_rid`,
      project_name: `${tablePrefix}.project_name`,
      project_startdate: `${tablePrefix}.project_startdate`,
      project_enddate: `${tablePrefix}.project_enddate`,
      total_effort: isParent
        ? `${tablePrefix}.total_effort`
        : `${tablePrefix}.total_effort_prj`,
      total_cost: isParent
        ? `${tablePrefix}.total_cost`
        : `${tablePrefix}.total_cost_prj`,
      // total_fte: `${tablePrefix}.total_fte`,
      total_cost_fte: isParent
        ? `${tablePrefix}.total_cost_fte`
        : `${tablePrefix}.total_cost_fte_prj`,
      total_cost_subcon: isParent
        ? `${tablePrefix}.total_cost_subcon`
        : `${tablePrefix}.total_cost_subcon_prj`,
      // total_subcon: `${tablePrefix}.total_subcon`,
      total_cost_nonlabor: isParent
        ? `${tablePrefix}.total_cost_nonlabor`
        : `${tablePrefix}.total_cost_nonlabor_prj`,
      project_code: `${tablePrefix}.project_code`,
      assessment_status: `${tablePrefix}.assessment_status`,
      project_point_of_contact: `${tablePrefix}.project_point_of_contact`,
      project_point_of_contact_email: `${tablePrefix}.project_point_of_contact_email`,
      technical_point_of_contact: `${tablePrefix}.technical_point_of_contact`,
      technical_point_of_contact_email: `${tablePrefix}.technical_point_of_contact_email`,
      rd_percent_final: `pfs.rd_percent_final`,
      qre_final: `pfs.qre_final`,
      is_assesed: `pfs.is_assesed`,
      // financial_consultant: `${tablePrefix}.financial_consultant`,
    };

    const numberFields = [
      `${fieldAliasMap.total_effort}`,
      `${fieldAliasMap.total_cost}`,
      "total_fte",
      `${fieldAliasMap.total_cost_fte}`,
      "total_subcon",
      `${fieldAliasMap.total_cost_subcon}`,
      `${fieldAliasMap.total_cost_nonlabor}`,
      "qre",
      `pfs.qre_final`,
      `pfs.rd_percent_final`
    ];
    const dateFields = [
      "project_startdate",
      "project_enddate",
      `${tablePrefix}.modified_datetime`,
    ];
    const enumFields = [
      "status_rid",
      `${fieldAliasMap.project_type_rid}`,
      "fiscal_year",
      "st.rid",
      "curr.rid",
      "cou.rid",
    ];
    const booleanFields = ["is_rd_qualified", `pfs.is_assesed`];

    const { conditions, replacements } = this.buildWhereCondition(
      where,
      dateFields,
      enumFields,
      booleanFields,
      numberFields,
      fieldAliasMap,
      tablePrefix
    );

    if (search) {
      const numericSearch = !isNaN(parseFloat(search));

      const allProjectFields = [
        "project_code",
        "project_name"
      ];

      const searchFieldAliasMap: Record<string, string> = {
        project_code: `${tablePrefix}.project_code`,
        project_name: `${tablePrefix}.project_name`
      };

      const searchConditions: string[] = [];

      for (const field of allProjectFields) {
        const qualifiedField = searchFieldAliasMap[field] || field;
        searchConditions.push(`${qualifiedField} ILIKE ?`);
        replacements.push(`%${search}%`);
      }
      conditions.push(`(${searchConditions.join(" OR ")})`);
    }

    const whereSQL = conditions.length > 0 ? `${conditions.join(" AND ")}` : "";
    return { whereSQL, replacements };
  }

  buildWhereCondition(
    where: Record<string, any>,
    dateFields: string[],
    enumFields: string[],
    booleanFields: string[],
    numberFields: string[],
    fieldAliasMap: Record<string, string>,
    tablePrefix: string
  ) {
    const conditions: string[] = [];
    const replacements: any[] = [];

    for (const [field, condition] of Object.entries(where)) {
      const qualifiedField = fieldAliasMap[field] || field;

      const isNumberField = numberFields.includes(qualifiedField);
      const isDateField = dateFields.includes(qualifiedField);
      const isEnumField = enumFields.includes(qualifiedField);
      const isBooleanField = booleanFields.includes(qualifiedField);

      // Skip empty string values for typed fields to avoid SQL type errors
      if (
        (condition?.equals === "" || condition === "") &&
        (isNumberField || isDateField || isBooleanField)
      ) {
        continue;
      }

      if (typeof condition === "object" && condition !== null) {
        if (field === "classification_name") {
          const conditionsToJoin: string[] = [];

          if (condition.equals !== undefined) {
            conditionsToJoin.push(
              `${tablePrefix}.project_classification_other = ?`
            );
            replacements.push(condition.equals);
            conditionsToJoin.push(`pc.classification_name = ?`);
            replacements.push(condition.equals);
          }

          if (condition.not_equals !== undefined) {
            if (condition.not_equals === "Other") {
              conditions.push(`pc.classification_name != ?`);
              replacements.push(condition.not_equals);
            } else {
              conditions.push(
                `(${tablePrefix}.project_classification_other != ? OR ${tablePrefix}.project_classification_other = '' OR ${tablePrefix}.project_classification_other IS NULL) AND pc.classification_name = 'Other'`
              );
              replacements.push(condition.not_equals);
            }
          }

          if (condition.in && Array.isArray(condition.in)) {
            const placeholders = condition.in.map(() => "?").join(", ");
            conditionsToJoin.push(
              `${tablePrefix}.project_classification_other IN (${placeholders})`
            );
            replacements.push(...condition.in);
            conditionsToJoin.push(
              `pc.classification_name IN (${placeholders})`
            );
            replacements.push(...condition.in);
          }

          if (condition.is_empty === true) {
            conditionsToJoin.push(
              `COALESCE(${tablePrefix}.project_classification_other, pc.classification_name) IS NULL OR COALESCE(${tablePrefix}.project_classification_other, pc.classification_name) = ''`
            );
          }

          if (conditionsToJoin.length > 0) {
            conditions.push(`(${conditionsToJoin.join(" OR ")})`);
          }

          continue;
        }

        // NUMBER fields
        if (isNumberField) {
          if (condition.equals !== undefined) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(condition.equals);
          }
          if (condition.not_equals !== undefined) {
            conditions.push(
              `(${qualifiedField} != ? OR ${qualifiedField} IS NULL)`
            );
            replacements.push(condition.not_equals);
          }
          if (condition.greater_than !== undefined) {
            conditions.push(`${qualifiedField} > ?`);
            replacements.push(condition.greater_than);
          }
          if (condition.less_than !== undefined) {
            conditions.push(`${qualifiedField} < ?`);
            replacements.push(condition.less_than);
          }
          if (
            Array.isArray(condition.between) &&
            condition.between.length === 2
          ) {
            conditions.push(`${qualifiedField} BETWEEN ? AND ?`);
            replacements.push(condition.between[0], condition.between[1]);
          }
          if (condition.is_empty === true) {
            conditions.push(`${qualifiedField} IS NULL`);
          }
          continue;
        }

        // DATE fields
        if (isDateField) {
          const updatedField =
            field === "modified_datetime"
              ? `${tablePrefix}.modified_datetime`
              : field;
          const normalize = (d: any) => {
            let parsed = moment.utc(d, "YYYY-MM-DD", true);
            if (!parsed.isValid()) throw new Error("Invalid date");

            const startOfDay = parsed.startOf("day").toDate();
            return startOfDay;
          };

          if (condition.equals !== undefined) {
            const startOfDay = new Date(condition.equals);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(condition.equals);
            endOfDay.setHours(23, 59, 59, 999);
            conditions.push(`${updatedField} BETWEEN ? AND ?`);
            replacements.push(startOfDay, endOfDay);
          }
          if (condition.before !== undefined) {
            conditions.push(`${updatedField} < ?`);
            replacements.push(normalize(condition.before));
          }
          if (condition.after !== undefined) {
            conditions.push(`${updatedField} > ?`);
            replacements.push(normalize(condition.after));
          }
          if (
            Array.isArray(condition.between) &&
            condition.between.length === 2
          ) {
            conditions.push(`${updatedField} BETWEEN ? AND ?`);
            replacements.push(
              normalize(condition.between[0]),
              normalize(condition.between[1])
            );
          }
          if (condition.is_empty === true) {
            conditions.push(`${updatedField} IS NULL`);
          }
          continue;
        }

        // ENUM fields
        if (isEnumField) {
          if (condition.equals !== undefined) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(condition.equals);
          }
          if (condition.not_equals !== undefined) {
            conditions.push(
              `(${qualifiedField} != ? OR ${qualifiedField} IS NULL)`
            );
            replacements.push(condition.not_equals);
          }
          if (condition.in && Array.isArray(condition.in)) {
            const placeholders = condition.in.map(() => "?").join(", ");
            conditions.push(`${qualifiedField} IN (${placeholders})`);
            replacements.push(...condition.in);
          }
          if (condition.is_empty === true) {
            conditions.push(`${qualifiedField} IS NULL`);
          }
          continue;
        }

        // BOOLEAN fields
        if (isBooleanField) {
          if (condition.equals !== undefined) {
            const boolVal = condition.equals === "true" || condition.equals === true;
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(boolVal);
          }
          if (condition.not_equals !== undefined) {
            const boolVal = condition.not_equals === "true" || condition.not_equals === true;
            conditions.push(`(${qualifiedField} != ? OR ${qualifiedField} IS NULL)`);
            replacements.push(boolVal);
          }
          if (condition.isTrue === true) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(true);
          }
          if (condition.isFalse === true) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(false);
          }
          if (condition.in && Array.isArray(condition.in)) {
            const boolValues = condition.in.map((v: any) => v === "true" || v === true);
            const placeholders = boolValues.map(() => "?").join(", ");
            conditions.push(`${qualifiedField} IN (${placeholders})`);
            replacements.push(...boolValues);
          }
          if (condition.is_empty === true) {
            conditions.push(`${qualifiedField} IS NULL`);
          }
          continue;
        }

        // STRING fields (default)
        if (condition.equals !== undefined) {
          conditions.push(`${qualifiedField} ILIKE ?`);
          replacements.push(condition.equals);
        }
        if (condition.not_equals !== undefined) {
          conditions.push(
            `(${qualifiedField} NOT ILIKE ? OR ${qualifiedField} IS NULL)`
          );
          replacements.push(condition.not_equals);
        }
        if (condition.contains !== undefined) {
          conditions.push(`${qualifiedField} ILIKE ?`);
          replacements.push(`%${condition.contains}%`);
        }
        if (condition.not_contains !== undefined) {
          conditions.push(
            `(${qualifiedField} NOT ILIKE ? OR ${qualifiedField} IS NULL)`
          );
          replacements.push(`%${condition.not_contains}%`);
        }
        if (condition.is_empty === true) {
          conditions.push(
            `(${qualifiedField} IS NULL OR ${qualifiedField} = '')`
          );
        }
        if (condition.value !== undefined) {
          conditions.push(`${qualifiedField} = ?`);
          replacements.push(condition.value);
        }
      } else {
        // Primitive direct equality
        conditions.push(`${field} = ?`);
        replacements.push(condition);
      }
    }

    return {
      conditions,
      replacements,
    };
  }

  private sortProjectByAccount(
    results: any[],
    whereClause: Record<string, any>,
    sort: { sortCol: string; sortOrder: string }
  ): any[] {
    const updatedResources = results
      .filter((res) => {
        if (
          whereClause.account_name &&
          !this.applyTextFilter(res.account_name, whereClause.account_name)
        ) {
          return false;
        }

        if (
          whereClause.account_number &&
          !this.applyTextFilter(res.account_number, whereClause.account_number)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const field = sort.sortCol;
        const direction = sort.sortOrder;
        const dir = direction === "ASC" ? 1 : -1;

        if (field === "account_name") {
          return (
            (a.account_name || "").localeCompare(b.account_name || "") * dir
          );
        }
        if (field === "account_number") {
          return (
            (a.account_number || "").localeCompare(b.account_number || "") * dir
          );
        }

        return 0;
      });

    return updatedResources;
  }

  async insertProjectListGeoData(project: any, mainDdSequilze: Sequelize) {
    try {
      const countryIds = [
        ...new Set(project.map((r: any) => r.country)),
      ].filter(Boolean);
      const regionIds = [...new Set(project.map((r: any) => r.region))].filter(
        Boolean
      );
      const currencyIds = [
        ...new Set(project.map((r: any) => r.currency)),
      ].filter(Boolean);

      let countryRows: any[] = [];
      let states: any[] = [];
      let currencies: any[] = [];

      if (countryIds.length > 0) {
        countryRows = await mainDdSequilze.query(
          rawQueries.GET_COUNTRIES,
          {
            replacements: { countryRid: countryIds },
            type: "SELECT",
          }
        );
      }

      if (regionIds.length > 0) {
        states = await mainDdSequilze.query(
          rawQueries.GET_REGIONS,
          {
            replacements: { regionRid: regionIds },
            type: "SELECT",
          }
        );
      }

      if (currencyIds.length > 0) {
        currencies = await mainDdSequilze.query(
          rawQueries.GET_CURRENCIES,
          {
            replacements: { currencyRid: currencyIds },
            type: "SELECT",
          }
        );
      }

      const countryMap = Object.fromEntries(
        (Array.isArray(countryRows) ? countryRows : []).map((c: any) => [
          c.rid,
          c,
        ])
      );

      const regionMap = Object.fromEntries(
        (Array.isArray(states) ? states : []).map((s: any) => [s.rid, s])
      );

      const currencyMap = Object.fromEntries(
        (Array.isArray(currencies) ? currencies : []).map((s: any) => [
          s.rid,
          s,
        ])
      );

      const updatedProjects = project.map((res: any) => ({
        ...res,
        country_name: countryMap[res.country]?.country_name || null,
        region_name: regionMap[res.region]?.state_name || null,
        currency_name: currencyMap[res.currency]?.currency_code || null,
        currency_symbol: currencyMap[res.currency]?.currency_symbol || null,
      }));

      return updatedProjects;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async insertIndusty(project: any, mainDdSequilze: Sequelize) {
    try {
      const industryIds = [
        ...new Set(project.map((r: any) => r.industry_rid)),
      ].filter(Boolean);

      let IndustryRows: any[] = [];
      let updatedProjects = project;

      if (industryIds.length > 0) {
        IndustryRows = await mainDdSequilze.query(
          rawQueries.GET_INDUSTRY,
          {
            replacements: { ids: industryIds },
            type: "SELECT",
          }
        );

        const industryMap = Object.fromEntries(
          (Array.isArray(IndustryRows) ? IndustryRows : []).map((c: any) => [
            c.rid,
            c,
          ])
        );

        updatedProjects = project.map((res: any) => {
          const jsonRes = typeof res.toJSON === "function" ? res.toJSON() : res;
          const industryRid = res.industry_rid;

          const mappedIndustryName =
            industryRid && industryMap[industryRid]?.industry_name !== "Other"
              ? industryMap[industryRid]?.industry_name
              : res.industry_name ?? null;

          return {
            ...jsonRes,
            industry_name: mappedIndustryName,
          };
        });
      }

      return updatedProjects;
    } catch (err) {
      throw new Error("Error fetching Industry" + (err as Error).message);
    }
  }

  async insertKeyRole(projects: any[], mainDdSequilze: Sequelize) {
    try {
      const allKeyContacts = projects.flatMap((p) => p.keyContact || []);
      const keyContactIds = [
        ...new Set(allKeyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};
      let keyContactRoleMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDdSequilze.query(
          rawQueries.fetchKeyContactsByIds(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
        keyContactRoleMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.role_map, c.role_name])
        );
      }

      const updatedProjects = projects.map((project) => {
        const keyContacts = project.keyContact || [];

        const enrichedKeyContacts = keyContacts.map((kc: any) => ({
          ...kc,
          role_name: keyContactMap[kc.key_contact_role] || null
        }));

        const technicalConsultant = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === keyContactRoleMap[primaryKeyContacts.technical_point_of_contact] &&
            e.is_primary_contact
        );
        const financialConsultant = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === keyContactRoleMap[primaryKeyContacts.financial_consultant] && e.is_primary_contact
        );
        const pointOfContact = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === keyContactRoleMap[primaryKeyContacts.project_point_of_contact] && e.is_primary_contact
        );

        return {
          ...project,
          keyContact: [],
          technical_point_of_contact: technicalConsultant
            ? technicalConsultant.key_contact_name
            : null,
          financial_consultant: financialConsultant
            ? financialConsultant.key_contact_name
            : null,
          project_point_of_contact: pointOfContact
            ? pointOfContact.key_contact_name
            : null,
        };
      });

      return updatedProjects;
    } catch (err) {
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async insertIndustyName(project: any, mainDdSequilze: Sequelize) {
    try {
      if (project.industry_rid && !project.industry_name) {
        const industryResult: any = await mainDdSequilze.query(
          rawQueries.getIndustryById(),
          {
            replacements: { id: project.industry_rid },
            type: "SELECT",
          }
        );

        const industry = industryResult[0];
        project.industry_name =
          industry?.industry_name || project.industry_name;
      }

      return project;
    } catch (err) {
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async insertProjectTypeAndStatus(project: any, mainDdSequilze: Sequelize, projectTypesFromConfig: string[]) {
    try {
      if (project.status_rid) {
        const statusResult: any = await mainDdSequilze.query(
          rawQueries.fetchStatusById(),
          {
            replacements: { rid: project.status_rid },
            type: "SELECT",
          }
        );

        const status = statusResult[0];
        project.status_name = status?.status_name;
      }
      if (project.project_type_rid) {
        const projectTypeResult: any = await mainDdSequilze.query(
          rawQueries.getProjectTypeByIdQuery(),
          {
            replacements: { id: project.project_type_rid },
            type: "SELECT",
          }
        );
        const projectType = projectTypeResult[0];
        project.project_type_name = projectType?.project_type_name;
        project.is_rd_trigger_qualified = false;
        if (projectTypesFromConfig && projectTypesFromConfig.length > 0) {
          if (project.project_type_rid) {
            const normalizedProjectTypeName = project.project_type_rid.trim().toLowerCase();
            const normalizedProjectTypes = projectTypesFromConfig.map((pt: string) => pt.trim().toLowerCase());
            project.is_rd_trigger_qualified = normalizedProjectTypes.includes(normalizedProjectTypeName);
          }
        }
      }

      return project;
    } catch (err) {
      throw new Error("Error enriching key roles: " + (err as Error).message);
    }
  }

  async projectKeyContactData(project: any, mainDdSequilze: any) {
    try {
      const plainProject =
        typeof project.toJSON === "function" ? project.toJSON() : project;

      const keyContacts = plainProject.keyContact || [];

      const keyContactIds = [
        ...new Set(keyContacts.map((r: any) => r.key_contact_role)),
      ].filter(Boolean);

      const statusIds = [
        ...new Set(keyContacts.map((r: any) => r.status_rid)),
      ].filter(Boolean);

      let keyContactMap: Record<string, string> = {};
      let statusMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDdSequilze.query(
          rawQueries.fetchKeyContactsByIds(),
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      if (statusIds.length > 0) {
        const statusRows = await mainDdSequilze.query(
          rawQueries.fetchStatusByIds(),
          {
            replacements: { ids: statusIds },
            type: "SELECT",
          }
        );

        statusMap = Object.fromEntries(
          statusRows.map((c: any) => [c.rid, c.status_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
        status_name: statusMap[kc.status_rid] || null,
      }));

      return {
        ...project,
        keyContact: enrichedKeyContacts,
      };
    } catch (err) {
      throw err;
    }
  }

  async projectClassificationData(project: any, mainDdSequilze: any) {
    try {
      let classificationName = project.project_classification_other;

      if (
        project &&
        project.project_classification_rid &&
        !project.project_classification_other
      ) {
        const [rows] = await mainDdSequilze.query(
          rawQueries.getProjectClassificationByIdQuery(),
          {
            replacements: { rid: project.project_classification_rid },
            type: mainDdSequilze.QueryTypes.SELECT,
          }
        );

        if (rows) {
          classificationName = rows.classification_name;
        }
      }

      return {
        ...project,
        classification_name: classificationName,
      };
    } catch (err) {
      throw err;
    }
  }

  async insertProjectClassification(project: any, mainDdSequilze: Sequelize) {
    try {
      const classificationIds = [
        ...new Set(project.map((r: any) => r.project_classification_rid)),
      ].filter(Boolean);

      let classificationRows: any[] = [];
      let updatedProjects = project;

      if (classificationIds.length > 0) {
        classificationRows = await mainDdSequilze.query(
          rawQueries.fetchProjectClassificationById(),
          {
            replacements: { ids: classificationIds },
            type: "SELECT",
          }
        );

        const classificationMap = Object.fromEntries(
          (Array.isArray(classificationRows) ? classificationRows : []).map(
            (c: any) => [c.rid, c]
          )
        );

        updatedProjects = project.map((res: any) => ({
          ...(typeof res.toJSON === "function" ? res.toJSON() : res),
          classification_name: res.project_classification_other
            ? res.project_classification_other
            : classificationMap[res.project_classification_rid]
              ?.classification_name || null,
          is_other_classification: res.project_classification_other !== null,
        }));
      }

      return updatedProjects;
    } catch (err) {
      throw new Error("Error fetching Industry" + (err as Error).message);
    }
  }

  finalProjectSort(
    project: any[],
    sortBy: string,
    sortOrder: string,
    filters?: Record<string, any>
  ): any {
    const filterableClientFields = [
      "account_name",
      "country_rid",
      "region_rid",
      "currency_rid",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name",
    ];

    const enumFields = [
      "country_rid",
      "currency_rid",
      "region_rid",
      "classification_name",
    ];

    let filteredProjects = [...project];

    const hasValidFilters = filterableClientFields.some((key) => {
      const f = filters?.[key];
      return (
        f &&
        Object.keys(f).some(
          (k) => f[k] !== undefined && f[k] !== null && f[k] !== ""
        )
      );
    });

    if (hasValidFilters && filters) {
      filteredProjects = filteredProjects.filter((project) => {
        return filterableClientFields.every((key) => {
          const filter = filters[key];
          if (!filter || Object.keys(filter).length === 0) return true;

          const value = project[key];
          const isEnumField = enumFields.includes(key);

          if (isEnumField) {
            if (key === "classification_name") {
              if (filter.equals !== undefined) {
                if (filter.equals == "Other") {
                  return project.is_other_classification === true;
                } else {
                  return (
                    !project.is_other_classification &&
                    project.classification_name === filter.equals
                  );
                }
              }
              if (filter.not_equals !== undefined) {
                if (filter.not_equals == "Other") {
                  return !project.is_other_classification;
                } else {
                  return (
                    project.is_other_classification === true ||
                    project.classification_name === null ||
                    (project.is_other_classification === false &&
                      project.classification_name !== filter.not_equals)
                  );
                }
              }
              if (filter.is_empty === true) {
                return value === null || value === "";
              }
              if (filter.in !== undefined && Array.isArray(filter.in)) {
                const containsOther = filter.in.includes("Other");
                const hasOtherOnly = filter.in.length === 1 && containsOther;

                if (hasOtherOnly) {
                  return (
                    project.project_classification_other !== null &&
                    project.is_other_classification
                  );
                } else if (containsOther) {
                  return (
                    (filter.in.includes(value) &&
                      !project.is_other_classification) ||
                    (project.project_classification_other !== null &&
                      project.is_other_classification)
                  );
                } else {
                  return filter.in.includes(value);
                }
              }
            } else {
              if (filter.equals !== undefined) {
                return value === filter.equals;
              }
              if (filter.not_equals !== undefined) {
                return value !== filter.not_equals;
              }
              if (filter.is_empty === true) {
                return value === null || value === "";
              }
              if (filter.in !== undefined && Array.isArray(filter.in)) {
                return filter.in.includes(value);
              }
            }
          } else {
            if (filter.equals !== undefined) {
              return value === filter.equals;
            }
            if (filter.not_equals !== undefined) {
              return value !== filter.not_equals;
            }
            if (filter.contains !== undefined) {
              if (typeof value === "string") {
                return value
                  .toLowerCase()
                  .includes(filter.contains.toLowerCase());
              }
              return false;
            }
            if (
              filter.not_contains !== undefined &&
              typeof value === "string"
            ) {
              return !value
                .toLowerCase()
                .includes(filter.not_contains.toLowerCase());
            }
            if (filter.is_empty === true) {
              return value === null || value === "";
            }
          }

          return true;
        });
      });
    }

    if (!sortBy || sortBy === "created_datetime") {
      return filteredProjects;
    }

    const sortedList = filteredProjects.sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA == null) return sortOrder === "ASC" ? 1 : -1;
      if (valB == null) return sortOrder === "ASC" ? -1 : 1;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "ASC"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "ASC" ? valA - valB : valB - valA;
    });

    return sortedList;
  }

  async insertUserDetails(projectData: any): Promise<any> {
    try {
      const mainDbInit = await initMainDbSequelize();

      const createdById = projectData.created_by;
      const modifiedById = projectData.modified_by;

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results] = await mainDbInit.query(
          rawQueries.fetchUserById(),
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
      const modifiedName = await getUserFullName(modifiedById);

      return {
        ...projectData,
        created_name: createdName || null,
        modified_name: modifiedName || null,
      };
    } catch (err) {
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }

  /**
   * Gets all child accounts for a given entity ID
   * @param schemaName - The schema name to query
   * @param entityId - The parent entity ID to find children for
   * @returns Promise containing array of child account records
   */
  async getChildAccounts(entityId: string) {
    try {
      const mainDbSequelize = await initMainDbSequelize();

      const childAccounts = await mainDbSequelize.query(
        rawQueries.getAccountsByParentAccountRidQuery(),
        {
          replacements: { entityId },
          type: "SELECT",
        }
      );

      return childAccounts;
    } catch (err) {
      throw new Error(
        "Error getting child accounts: " + (err as Error).message
      );
    }
  }

  async fetchAttachmentsByProjectId(project_rid: string): Promise<any[]> {
    try {
      const sequelize = await initMainDbSequelize();

      const result = await sequelize.query(
        rawQueries.getAttachmentsByProjectRidQuery(),
        {
          replacements: { project_rid },
          type: "SELECT",
        }
      );

      return result;
    } catch (error) {
      console.error("Error fetching attachments:", error);
      throw new Error("Failed to fetch attachments");
    }
  }

  async fetchAttachmentsByResourceId(resource_rid: string): Promise<any[]> {
    try {
      const sequelize = await initMainDbSequelize();

      const result = await sequelize.query(
        rawQueries.getAttachmentsByResourceRidQuery(),
        {
          replacements: { resource_rid },
          type: "SELECT",
        }
      );

      return result;
    } catch (error) {
      console.error("Error fetching attachments:", error);
      throw new Error("Failed to fetch attachments");
    }
  }

  async fetchAccountsByIds(accountRids: string[]) {
    try {
      const mainDbSequelize = await initMainDbSequelize();

      // Return empty array if no account IDs provided
      if (!accountRids || accountRids.length === 0) {
        return [];
      }

      const accounts = await mainDbSequelize.query(
        rawQueries.getAccountsByRidsQuery(),
        {
          replacements: { accountRids },
          type: "SELECT",
        }
      );

      return accounts;
    } catch (err) {
      throw new Error(
        "Error fetching accounts by IDs: " + (err as Error).message
      );
    }
  }

  async fetchAccountsWithStatusByIds(accountRids: string[]) {
    try {
      const mainDbSequelize = await initMainDbSequelize();

      // Return empty array if no account IDs provided
      if (!accountRids || accountRids.length === 0) {
        return [];
      }

      const accounts = await mainDbSequelize.query(
        rawQueries.getAccountsWithStatusByRidsQuery(),
        {
          replacements: { accountRids },
          type: "SELECT",
        }
      );

      return accounts;
    } catch (err) {
      throw new Error(
        "Error fetching accounts by IDs: " + (err as Error).message
      );
    }
  }

  async getUserGroupType(userRid: string): Promise<string | null> {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      const results = await mainDbSequelize.query<{ group_type: string }>(
        rawQueries.getUserGroupTypeByUserRidQuery(), // Important if user can only have one group type
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return null;
      }

      return results[0]?.group_type ?? null;
    } catch (error) {
      // Log the error for debugging
      console.error("Error fetching user group type:", error);
      throw new Error("Failed to get user group type");
    }
  }

  async getUserProfileType(
    userRid: string
  ): Promise<{ profileName: string; email: string } | null> {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      const results = await mainDbSequelize.query<{
        profile_name: string;
        email: string;
      }>(
        rawQueries.getUserProfileAndEmailByUserRidQuery(),
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return null;
      }

      // Return renamed keys to match camelCase (optional)
      return {
        profileName: results[0]?.profile_name ?? "",
        email: results[0]?.email ?? "",
      };
    } catch (error) {
      console.error("Error fetching user profile info:", error);
      throw new Error("Failed to get user profile information");
    }
  }

  async getAccessibleAccountInfo(userRid: string): Promise<
    Array<{
      id: string;
      isChild: boolean;
      parentId: string | null;
    }>
  > {
    const mainDbSequelize = await initMainDbSequelize();

    try {
      // 1. Direct access with account info
      const directAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(
        rawQueries.getDirectAccountAccessQuery(),
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      // 2. Group access with account info
      const groupAccess = await mainDbSequelize.query<{
        entity_rid: string;
        parent_account_rid: string | null;
        is_child: boolean;
      }>(
        rawQueries.getGroupAccountAccessQuery(),
        {
          replacements: { userRid },
          type: QueryTypes.SELECT,
        }
      );

      // 3. Combine and deduplicate
      const allAccess = [...directAccess, ...groupAccess];
      const uniqueAccess = new Map<
        string,
        {
          id: string;
          isChild: boolean;
          parentId: string | null;
        }
      >();

      allAccess.forEach((access) => {
        if (!uniqueAccess.has(access.entity_rid)) {
          uniqueAccess.set(access.entity_rid, {
            id: access.entity_rid,
            isChild: access.is_child,
            parentId: access.parent_account_rid,
          });
        }
      });

      return Array.from(uniqueAccess.values());
    } catch (err) {
      console.error("Error in getAccessibleAccountInfo:", err);
      return [];
    }
  }

  async getAllowedExportFields(
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

  async fetchChildAccountRidByParentAccountId(
    mainSequelize: Sequelize,
    rid: string
  ): Promise<any[]> {
    try {
      const childAccounts = await mainSequelize.query(
        rawQueries.fetchChildAccountsByParentAccountRid(),
        {
          replacements: { parentRid: rid },
          type: QueryTypes.SELECT,
        }
      );
      return childAccounts;
    } catch (err) {
      throw new Error(
        "Error fetching child accounts: " + (err as Error).message
      );
    }
  }

  async updateQreAdjustmentCalculation(
    accountNumber: string,
    projectFiscalId: string,
    qreAdjustment: number,
    userId: string,
    accountRid: string
  ) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
    const sequelize = await initOrgSequelize();
    const mainSequelize = await initMainDbSequelize();

    const projectFiscalData: any = await sequelize.query(
      rawQueries.fetchProjectFiscalById(schemaName, projectFiscalId),
      {
        type: QueryTypes.SELECT,
      }
    );

    if (!projectFiscalData && projectFiscalData.length === 0) {
      throw new Error("Invalid Project Id");
    };

    const projectFiscalDetails = projectFiscalData[0];

    const existingPercent = projectFiscalDetails.rd_percent_potential_ai ?? 0;

    const parsedPercent = parseFloat(existingPercent);

    if (!isNaN(parsedPercent) && parsedPercent > 0) {
      const netQre = qreAdjustment + parseFloat(existingPercent);

      const totalCost = projectFiscalDetails.total_cost_prj ?? 0;
      const totalFteCost = projectFiscalDetails.total_cost_fte_prj ?? 0;
      const totalSubconCost = projectFiscalDetails.total_cost_subcon_prj ?? 0;
      const totalNonlaborCost = projectFiscalDetails.total_cost_nonlabor_prj ?? 0;

      const qreFinalCost = totalCost * (netQre / 100);
      const qreFteCost = totalFteCost * (netQre / 100);
      const qreSubconCost = totalSubconCost * (netQre / 100);
      const qreNonlaborCost = totalNonlaborCost * (netQre / 100);

      let isQualifiedFlag: boolean = false;
      if (qreAdjustment !== 0) isQualifiedFlag = true
      else isQualifiedFlag = false;

      await sequelize.query(
        rawQueries.updateProjectFiscalQre(schemaName,
          {
            rd_percent_adjustment: qreAdjustment,
            rd_percent_final: netQre,
            qre_final: qreFinalCost,
            qre_fte: qreFteCost,
            qre_subcon: qreSubconCost,
            qre_nonlabor: qreNonlaborCost,
            modified_by: userId,
            modified_datetime: new Date(),
            rid: projectFiscalId,
            is_qualified: isQualifiedFlag
          }
        ),
        {
          type: QueryTypes.SELECT,
        }
      );

      // update project summary
      await mainSequelize.query(
        rawQueries.updateProjectFiscalSummaryQre(
          {
            rd_percent_adjustment: qreAdjustment,
            rd_percent_final: netQre,
            qre_final: qreFinalCost,
            qre_fte: qreFteCost,
            qre_subcon: qreSubconCost,
            qre_nonlabor: qreNonlaborCost,
            modified_by: userId,
            modified_datetime: new Date(),
            rid: projectFiscalId,
            is_qualified: isQualifiedFlag
          }
        ),
        {
          type: QueryTypes.UPDATE,
        }
      );
      const userEventInfo: any = await this.fetchUserAndEventInfo({
        userId: userId!,
        eventType: eventTypes.UI_HANDLER
      });

      await this.createAccountTimelineEntry(accountNumber!, {
        created_by: userId!,
        account_rid: accountRid,
        entity_rid: projectFiscalId!,
        entity_name: entityTypes.QRE_PERCENT,
        created_by_name: userEventInfo.full_name,
        event_type_rid: userEventInfo.event_type_rid,
        event_name: eventNames.ADJUST,
        descriptions: 'for ' + projectFiscalDetails.project_code,
        project_rid: projectFiscalId
      }, ["project"]);
    }
  }
  async getSubscriptionDetailsByProjectId(parentaccountId: string, schemaName: string, accountId: string) {
    try {
      let schemaNameParent = `trd365_${schemaName.replace(/\D/g, "")}`;
      const query = rawQueries.fetchAccountInfo(schemaNameParent, accountId);
      const sequelize = await initOrgSequelize();
      const users: any = await sequelize.query(query, {
        replacements: { account_rid: accountId },
        type: "SELECT",
      });
      const parentquery = rawQueries.fetchAccountInfo(schemaNameParent, parentaccountId);
      const parentSubscriptioninfo: any = await sequelize.query(parentquery, {
        replacements: { accountId: parentaccountId },
        type: "SELECT",
      });
      if (parentSubscriptioninfo && parentSubscriptioninfo.length > 0) {
        const parentDetails = parentSubscriptioninfo[0];
        const isSubscriptionCreated = Boolean(
          parentDetails.subscription_created &&
          parentDetails.tenant_id &&
          parentDetails.client_id &&
          parentDetails.client_secret);
        return isSubscriptionCreated;
      } else {
        return false;
      }
    } catch (err) {
      return false
    }
  }
}
export default SchemaService;
