import moment, { Moment } from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources, setupResourceSeq } from "../models/resource";
import {
  ICreateResource,
  IKeyContactDetail,
  IUpdateKeyContactDetail,
  IUpdateResource,
} from "../utils/types";

import { DataTypes, Op, Sequelize } from "sequelize";
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

// import { Skill } from "../models/skill";
class SchemaService {
  constructor() {}

  /**
   * Checks if the schema for a given account number exists.
   * @param accountNumber - The account number to check.
   * @returns A boolean indicating if the schema exists.
   */
  async checkIfSchemaExists(accountNumber: string) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const result = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schemaName`,
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
        `SELECT * FROM account WHERE rid = :rid and r_number = :r_number`,
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
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

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

      await Resource.sync({ force: false });
      await ResourcesHistoryModel.sync({ force: false });
      await ResourcesTimelineModel.sync({ force: false });
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
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();
      const mainDdSequilze = await initMainDbSequelize();
      let finalResources = null;

      const Resource = Resources.initialize(sequelize, schemaName);
      await Resource.sync({ force: false });

      // Handle special case for resource_type sorting
      let queryOrder = order;
      const isResourceTypeSort =
        order?.length && order[0][0] === "resource_type";
      const isAccountNameSort = 
        order?.length && order[0][0] === "account_name";
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
        const direction = order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.col('AccountDetails.account_name'), direction]];
      } else if (isTotalProjectHoursSort) {
        const direction = order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal('total_project_hours'), direction]];
      } else if (isEstimatedRDSort) {
        const direction = order[0][1]?.toUpperCase() === "DESC"? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal('estimated_rd_hours'), direction]];
      }

      const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
      const ResourceFiscalModel = ResourceFiscal.initialize(sequelize, schemaName);

      Resource.belongsTo(AccountDetailsModel, {
        foreignKey: 'account_rid',
        as: 'AccountDetails',
        targetKey: 'account_rid'
      });

      Resource.hasMany(ResourceFiscalModel, {
        foreignKey: 'resource_rid',
        sourceKey: 'rid',
        as: 'ResourceFiscal'
      });

      // First get all resources without pagination
      const resources = await Resource.findAll({
        where: {
          ...whereClause,
          account_rid: accountId,
        },
        having: havingClause,
        group: [
          'Resources.rid',
          'Resources.r_number',
          'Resources.resource_code',
          'Resources.resource_name', 
          'Resources.resource_firstname',
          'Resources.resource_lastname',
          'Resources.resource_orgname',
          'Resources.comments',
          'Resources.resource_type',
          'Resources.resource_status',
          'Resources.resource_role',
          'Resources.resource_designation',
          'Resources.resource_total_experience',
          'Resources.resource_country',
          'Resources.resource_region',
          'Resources.resource_city',
          'AccountDetails.rid',
          'AccountDetails.account_rid',
          'AccountDetails.account_name',
          'ResourceFiscal.rid',
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
          "resource_type",
          "resource_status",
          "resource_role",
          "resource_designation",
          "resource_orgname",
          "comments",
          "resource_total_experience",
          "resource_country", 
          "resource_region",
          "resource_city",
          [Sequelize.col('AccountDetails.account_name'), 'account_name'],
          [Sequelize.literal('COALESCE("ResourceFiscal"."total_effort_for_year_project",0)'), 'total_project_hours'],
          [Sequelize.literal('COALESCE("ResourceFiscal"."estimated_rd_hours",0)'), 'estimated_rd_hours']
        ],
        include: [
          {
            model: ResourceFiscalModel,
            as: 'ResourceFiscal',
            attributes: [],
            required: false
          },
          {
            model: AccountDetailsModel,
            as: 'AccountDetails',
            attributes: [],
            required: false
          }
        ]
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
      throw new Error("Error fetching resources: " + (err as Error).message);
    }
  }

  /**
   * Fetches a single resource by ID.
   * @param accountNumber - Account number (schema).
   * @param accountId - Resource ID (RID).
   * @returns Resource record or null.
   */
  async fetchResourceById(accountNumber: string, accountId: string) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);
      const resource = await Resource.findOne({
        where: {
          rid: accountId,
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
      const schemaName = `platform_v2_${accountNumber}`;

      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);

      const isRefIdExist = await Resource.findOne({
        where: {
          resource_code: {
            [Op.iLike]: resourceData.resource_code,
          },
        },
      });

      if (isRefIdExist) {
        throw new Error("Resource Code must be unique.");
      }

      const resourceObject = {
        resource_code: resourceData.resource_code,
        resource_type: resourceData.resource_type,
        resource_name: resourceData.name || null,
        resource_firstname: resourceData.first_name || null,
        resource_lastname: resourceData.last_name || null,
        resource_status: resourceData.resource_status,
        resource_orgname: resourceData.org_name || null,
        resource_startdate: moment(startDate).isValid()
          ? moment(startDate).toDate()
          : null,
        resource_enddate: moment(endDate).isValid()
          ? moment(endDate).toDate()
          : null,
        resource_role: resourceData.role || null,
        resource_region: resourceData.resource_region || null,
        resource_country: resourceData.resource_country || null,
        resource_city: resourceData.resource_city || null,
        resource_designation: resourceData.resource_designation || null,
        resource_total_experience: resourceData.total_years_experience || 0,
        resource_total_experience_organization:
          resourceData.total_years_in_org || 0,
        created_by: resourceData.created_by,
        modified_by: resourceData.modified_by,
        account_rid: resourceData.account_id,
        comments: resourceData.comments || "",
      };

      const resource = await Resource.create(resourceObject);

      if (resource && resource.rid) {
        this.insertResourceFiscalTable(
          sequelize,
          schemaName,
          resourceData,
          resource.rid,
          startDate,
          endDate
        );
        this.addTimeline(
          accountNumber,
          resourceData,
          resource.rid,
          "create",
          resource.account_rid
        );
      }

      return resource;
    } catch (err) {
      throw new Error((err as Error).message);
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
    geoDataSort: string[][]
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();
      const mainDdSequilze = await initMainDbSequelize();
      let finalResources = null;

      const Resource = Resources.initialize(sequelize, schemaName);
      await Resource.sync({ force: false });

      let queryOrder = order;
      const isResourceTypeSort =
        order?.length && order[0][0] === "resource_type";
      const isAccountNameSort = 
        order?.length && order[0][0] === "account_name";
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
        const direction = order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.col('AccountDetails.account_name'), direction]];
      } else if (isTotalProjectHoursSort) {
        const direction = order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal('total_project_hours'), direction]];
      } else if (isEstimatedRDSort) {
        const direction = order[0][1]?.toUpperCase() === "DESC"? "DESC" : "ASC";
        queryOrder = [[Sequelize.literal('estimated_rd_hours'), direction]];
      }

      const AccountDetailsModel = AccountDetails.initialize(sequelize, schemaName);
      const ResourceFiscalModel = ResourceFiscal.initialize(sequelize, schemaName);

      Resource.belongsTo(AccountDetailsModel, {
        foreignKey: 'account_rid',
        as: 'AccountDetails',
        targetKey: 'account_rid'
      });

      Resource.hasMany(ResourceFiscalModel, {
        foreignKey: 'resource_rid',
        sourceKey: 'rid',
        as: 'ResourceFiscal'
      });

      const resources = await Resource.findAll({
        where: {
          ...whereClause,
        },
        having: havingClause,
        group: [
          'Resources.rid',
          'Resources.r_number',
          'Resources.resource_code',
          'Resources.resource_name', 
          'Resources.resource_firstname',
          'Resources.resource_lastname',
          'Resources.resource_orgname',
          'Resources.comments',
          'Resources.resource_type',
          'Resources.resource_status',
          'Resources.resource_role',
          'Resources.resource_designation',
          'Resources.resource_total_experience',
          'Resources.resource_country',
          'Resources.resource_region',
          'Resources.resource_city',
          'AccountDetails.rid',
          'AccountDetails.account_rid',
          'AccountDetails.account_name',
          'ResourceFiscal.rid',
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
          "resource_type",
          "resource_status",
          "resource_role",
          "resource_designation",
          "resource_orgname",
          "comments",
          "resource_total_experience",
          "resource_country",
          "resource_region",
          "resource_city",
          [Sequelize.col('AccountDetails.account_name'), 'account_name'],
          [Sequelize.literal('COALESCE("ResourceFiscal"."total_effort_for_year_project",0)'), 'total_project_hours'],
          [Sequelize.literal('COALESCE("ResourceFiscal"."estimated_rd_hours",0)'), 'estimated_rd_hours'],
        ],
        include: [
          {
            model: ResourceFiscalModel,
            as: 'ResourceFiscal',
            attributes: [],
            required: false
          },
          {
            model: AccountDetailsModel,
            as: 'AccountDetails',
            attributes: [],
            required: false
          }
        ]
      });

      const results = await Resource.findAll({
        where: {
          ...whereClause,
        },
        having: havingClause,
        group: [
          'Resources.rid',
          'Resources.r_number',
          'Resources.resource_code',
          'Resources.resource_name',
          'Resources.resource_firstname',
          'Resources.resource_lastname',
          'Resources.resource_orgname',
          'Resources.comments',
          'Resources.resource_type',
          'Resources.resource_status',
          'Resources.resource_role',
          'Resources.resource_designation',
          'Resources.resource_total_experience',
          'Resources.resource_country',
          'Resources.resource_region',
          'Resources.resource_city',
          'AccountDetails.rid',
          'AccountDetails.account_rid',
          'AccountDetails.account_name',
          'ResourceFiscal.rid',
        ],
        raw: true,
        include: [
          {
            model: ResourceFiscalModel,
            as: 'ResourceFiscal',
            attributes: [],
            required: false
          },
          {
            model: AccountDetailsModel,
            as: 'AccountDetails',
            attributes: [],
            required: false
          }
        ]
      });
      
      const totalCount = results.length;
      

      if (resources) {
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortGeoData(finalResources, geoDataSort);
      }

      return { resources: finalResources, totalCount };
    } catch (err) {
      throw new Error("Error fetching resources: " + (err as Error).message);
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
        resource_type: resourceData.resource_type,
        resource_rid: resourceId,
        country_rid: resourceData.resource_country || null,
        country_region_rid: resourceData.resource_region || null,
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

      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      // Verify schema exists before querying
      const schemaExists = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schemaName`,
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
      const schemaName = `platform_v2_${accountNumber}`;
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
        resource_type: resourceData.resource_type || "",
        resource_status: resourceData.resource_status,
        resource_country: resourceData.resource_country || null,
        resource_region: resourceData.resource_region || null,
        resource_city: resourceData.resource_city || null,
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

      await this.updateResourceFiscal(
        resourceData,
        startDate,
        endDate,
        accountNumber
      );

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
      throw new Error((err as Error).message);
    }
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
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const ResourceFiscalModel = ResourceFiscal.initialize(
        sequelize,
        schemaName
      );
      await ResourceFiscalModel.update(
        {
          resource_type: resourceData.resource_type || "",
          country_rid: resourceData.resource_country || null,
          country_region_rid: resourceData.resource_region || null,
          effective_date: moment(startDate).isValid()
            ? moment(startDate).toDate()
            : null,
          end_date: moment(endDate).isValid() ? moment(endDate).toDate() : null,
          modified_by: resourceData.modified_by,
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

  /**
   * Fetches the parent account number for a given parent account ID.
   * @param parentAccountId - Parent account RID.
   * @returns Parent account number.
   */
  async fetchParentAccount(parentAccountId: string): Promise<string> {
    try {
      const sequelize = await initMainDbSequelize();

      const [account]: any[] = await sequelize.query(
        `SELECT * FROM account WHERE rid = :rid`,
        {
          replacements: { rid: parentAccountId },
          type: "SELECT",
        }
      );

      return account?.r_number;
    } catch (err) {
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
        `SELECT * FROM account WHERE r_number = :r_number`,
        {
          replacements: { r_number: accountNumber },
          type: "SELECT",
        }
      );

      if (account?.storage_type === "store_in_parent") {
        const [accountData]: any[] = await sequelize.query(
          `SELECT * FROM account WHERE rid = :rid`,
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
      const schemaName = `platform_v2_${accountNumber}`;
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
          modified_by:
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
      const schemaName = `platform_v2_${accountNumber}`;
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
          `SELECT country_code,country_name FROM country WHERE rid = :rid`,
          {
            replacements: { rid: resource.resource_country },
            type: "SELECT",
          }
        );
        const [state]: any[] = await mainDbSequelize.query(
          `SELECT state_name FROM state WHERE rid = :rid`,
          {
            replacements: { rid: resource.resource_region },
            type: "SELECT",
          }
        );
        const [city]: any[] = await mainDbSequelize.query(
          `SELECT city_name FROM city WHERE rid = :rid`,
          {
            replacements: { rid: resource.resource_city },
            type: "SELECT",
          }
        );

        (resource as any).dataValues.country_code =
          country?.country_code || null;
        (resource as any).dataValues.country_name =
          country?.country_name || null;
        (resource as any).dataValues.region_name = state?.state_name || null;
        (resource as any).dataValues.city_name = city?.city_name || null;
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
      const schemaName = `platform_v2_${accountNumber}`;
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
        modified_by:
          eventName === "update"
            ? resourceData.modified_by
            : resourceData.created_by,
      });
    } catch (err) {
      throw new Error("Error adding timeline : " + (err as Error).message);
    }
  }

  async insertGeoData(resources: any, mainDdSequilze: Sequelize) {
    try {
      const countryIds = [
        ...new Set(resources.map((r: any) => r.resource_country)),
      ].filter(Boolean);
      const regionIds = [
        ...new Set(resources.map((r: any) => r.resource_region)),
      ].filter(Boolean);
      const cityIds = [
        ...new Set(resources.map((r: any) => r.resource_city)),
      ].filter(Boolean);

      let countryRows: any[] = [];
      let states: any[] = [];
      let cities: any[] = [];

      if (countryIds.length > 0) {
        countryRows = await mainDdSequilze.query(
          `SELECT rid, country_name FROM country WHERE rid IN (:ids)`,
          {
            replacements: { ids: countryIds },
            type: "SELECT",
          }
        );
      }

      if (regionIds.length > 0) {
        states = await mainDdSequilze.query(
          `SELECT rid, state_name FROM state WHERE rid IN (:ids)`,
          {
            replacements: { ids: regionIds },
            type: "SELECT",
          }
        );
      }

      if (cityIds.length > 0) {
        cities = await mainDdSequilze.query(
          `SELECT rid, city_name FROM city WHERE rid IN (:ids)`,
          {
            replacements: { ids: cityIds },
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

      const updatedResources = resources.map((res: any) => ({
        ...res.toJSON(),
        country_name: countryMap[res.resource_country]?.country_name || null,
        region_name: regionMap[res.resource_region]?.state_name || null,
        city_name: cityMap[res.resource_city]?.city_name || null,
      }));

      return updatedResources;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }

  async sortGeoData(resources: any[], order: string[][] = []): Promise<any[]> {
    // Apply sorting if specified
    if (order && order.length > 0) {
      const [sortField, sortDirection] = order[0];
      const isAsc = sortDirection.toUpperCase() === "ASC";

      resources = resources.sort((a, b) => {
        let compareValueA, compareValueB;

        switch (sortField) {
          case "resource_country":
            compareValueA = a.country_name || null;
            compareValueB = b.country_name || null;
            break;
          case "resource_region":
            compareValueA = a.region_name || null;
            compareValueB = b.region_name || null;
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
      const countryId = project.country;
      const regionId = project.region;
      const currencyId = project.currency;

      let countryRow: any = null;
      let regionRow: any = null;
      let currencyRow: any = null;

      if (countryId) {
        const result = await mainDdSequilze.query(
          `SELECT rid, country_name FROM country WHERE rid = :id`,
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
          `SELECT rid, state_name FROM state WHERE rid = :id`,
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
          `SELECT rid, currency_name, currency_code FROM currency WHERE rid = :id`,
          {
            replacements: { id: currencyId },
            type: "SELECT",
          }
        );
        currencyRow =
          Array.isArray(result) && result.length > 0 ? result[0] : null;
      }

      project.dataValues = {
        ...project.dataValues,
        country_name: countryRow?.country_name || null,
        region_name: regionRow?.state_name || null,
        currency_name: currencyRow?.currency_code || null,
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
        `SELECT * FROM account WHERE rid = :rid`,
        {
          replacements: { rid: accountId },
          type: "SELECT",
        }
      );
      return accountData;
    } catch (err) {
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }

  async fetchAllProjects(
    offset: number,
    limit: number,
    sort: {
      sortCol: string;
      sortOrder: string;
    },
    whereClause: Record<string, any>,
    fiscalYear: number,
    accountMeta: string[],
    userId: string,
    search: string,
    accountDataSort: string[][]
  ) {
    try {
      const mainDbSequelize = await initMainDbSequelize();

      let results: any[] = [];
      const replacements: any[] = [];
      let countResult: any[] = [];

      const sortColumnMap: Record<string, string> = {
        industry_name: "COALESCE(ps.industry_name, ind.industry_name)",
      };

      const sortCol = sortColumnMap[sort.sortCol] || `${sort.sortCol}`;

      if (accountMeta.length > 0) {
        const accountRids = accountMeta.map((acc) => `'${acc}'`).join(", ");

        const { whereSQL: filterWhereSQL, replacements: whereReplacements } =
          this.buildRawWhereClause(whereClause, search);

        const whereConditions: string[] = [];
        replacements.push(...whereReplacements);

        if (fiscalYear && fiscalYear !== 0) {
          whereConditions.push(`fiscal_year = ?`);
          replacements.push(fiscalYear);
        }

        let fullWhereClause = filterWhereSQL;
        if (whereConditions.length > 0) {
          fullWhereClause += fullWhereClause
            ? ` AND ${whereConditions.join(" AND ")}`
            : `WHERE ${whereConditions.join(" AND ")}`;
        }

        const fullQuery = `
        SELECT ps.project_code, ps.project_name , ps.fiscal_year, acc.account_name, acc.rid as account_id,
        ps.project_id, ps.modified_datetime, ps.assessment_status,
        COALESCE(ps.industry_name, ind.industry_name) AS industry_name_other, 
        ps.project_number, ps.project_type, ps.project_client_group , ps.project_group,
        ps.project_classification_rid, 
        COALESCE(ps.project_classification_other, pc.classification_name) AS classification_name,
        ps.project_status , ps.project_point_of_contact , ps.financial_consultant , ps.technical_point_of_contact , ps.r_number,
        ps.program_name, ps.project_startdate , ps.project_enddate , ps.qualified_research_expenditure ,
        ps.is_rd_qualified , ps.qre, ps.total_cost , ps.total_effort , ps.total_fte , ps.total_fte_cost ,
        ps.total_sub_con , ps.total_sub_con_cost, ps.total_non_labor_cost , ps."comments" , 
        cou.country_name , curr.currency_code , st.state_name as region_name
        FROM project_summary AS ps
        INNER JOIN account acc ON acc.rid = ps.account_rid 
        LEFT JOIN industry ind ON ind.rid = ps.industry_rid
        LEFT JOIN country cou ON cou.rid = ps.country 
        LEFT JOIN state st ON st.rid = ps.region 
        LEFT JOIN currency curr ON curr.rid = ps.currency 
        left join project_classification pc on pc.rid = ps.project_classification_rid 
        WHERE acc.created_by = '${userId}' AND acc.rid in (${accountRids}) ${
          fullWhereClause ? "AND " + fullWhereClause : ""
        }
        ORDER BY ${sortCol} ${sort.sortOrder}
        LIMIT ? OFFSET ?
      `;

        const countQuery = `
          SELECT COUNT(*) AS total_count
          FROM project_summary AS ps
          INNER JOIN account acc ON acc.rid = ps.account_rid 
          LEFT JOIN industry ind ON ind.rid = ps.industry_rid
          LEFT JOIN country cou ON cou.rid = ps.country 
          LEFT JOIN state st ON st.rid = ps.region 
          LEFT JOIN currency curr ON curr.rid = ps.currency 
          LEFT JOIN project_classification pc ON pc.rid = ps.project_classification_rid 
          WHERE acc.created_by = '${userId}' AND acc.rid in (${accountRids}) ${
          fullWhereClause ? "AND " + fullWhereClause : ""
          }
        `;

        replacements.push(limit, offset);

        results = await mainDbSequelize.query(fullQuery, {
          replacements,
          type: "SELECT",
        });

        countResult = await mainDbSequelize.query(countQuery, {
          replacements: whereReplacements,
          type: "SELECT",
        });
      } else {
        const { whereSQL: filterWhereSQL, replacements: whereReplacements } =
          this.buildRawWhereClause(whereClause, search);

        const whereConditions = [];
        const replacements = [...whereReplacements];

        if (fiscalYear && fiscalYear !== 0) {
          whereConditions.push(`fiscal_year = ?`);
          replacements.push(fiscalYear);
        }

        let fullWhereClause = filterWhereSQL;
        if (whereConditions.length > 0) {
          fullWhereClause += fullWhereClause
            ? ` AND ${whereConditions.join(" AND ")}`
            : `${whereConditions.join(" AND ")}`;
        }

        const fullQuery = `
        SELECT ps.project_code, ps.project_name , ps.fiscal_year, acc.account_name, acc.rid as account_id,
        ps.project_id, ps.modified_datetime, ps.assessment_status,
        COALESCE(ps.industry_name, ind.industry_name) AS industry_name_other,
        ps.project_type, ps.project_client_group , ps.project_group,
        ps.project_classification_rid, 
        COALESCE(ps.project_classification_other, pc.classification_name) AS classification_name,
        ps.project_status , ps.project_point_of_contact , ps.financial_consultant , ps.technical_point_of_contact , ps.r_number, ps.project_number,
        ps.program_name, ps.project_startdate , ps.project_enddate , ps.qualified_research_expenditure ,
        ps.is_rd_qualified , ps.qre, ps.total_cost , ps.total_effort , ps.total_fte , ps.total_fte_cost ,
        ps.total_sub_con , ps.total_sub_con_cost, ps.total_non_labor_cost , ps."comments" , 
        cou.country_name , curr.currency_code , st.state_name as region_name
        FROM project_summary AS ps
        INNER JOIN account acc ON acc.rid = ps.account_rid 
        LEFT JOIN industry ind ON ind.rid = ps.industry_rid
        LEFT JOIN country cou ON cou.rid = ps.country 
        LEFT JOIN state st ON st.rid = ps.region 
        LEFT JOIN currency curr ON curr.rid = ps.currency 
        left join project_classification pc on pc.rid = ps.project_classification_rid 
        WHERE acc.created_by = '${userId}' ${
          fullWhereClause ? "AND " + fullWhereClause : ""
        }
        ORDER BY ${sortCol} ${sort.sortOrder}
        LIMIT ? OFFSET ?
      `;

        const countQuery = `
        SELECT COUNT(*) AS total_count
        FROM project_summary AS ps
        INNER JOIN account acc ON acc.rid = ps.account_rid 
        LEFT JOIN industry ind ON ind.rid = ps.industry_rid
        LEFT JOIN country cou ON cou.rid = ps.country 
        LEFT JOIN state st ON st.rid = ps.region 
        LEFT JOIN currency curr ON curr.rid = ps.currency 
        LEFT JOIN project_classification pc ON pc.rid = ps.project_classification_rid 
        WHERE acc.created_by = '${userId}'
        ${fullWhereClause ? "AND " + fullWhereClause : ""}
      `;

        replacements.push(limit, offset);

        results = await mainDbSequelize.query(fullQuery, {
          replacements,
          type: "SELECT",
        });

        countResult = await mainDbSequelize.query(countQuery, {
          replacements: whereReplacements,
          type: "SELECT",
        });
      }

      return {
        finalResult: results,
        totalCount: parseInt(countResult?.[0]?.total_count) || 0,
      };
    } catch (err) {
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }

  async computeGlobalAccountFilter(globalFilters: Record<string, string[]>) {
    try {
      const result = [];

      for (const key of Object.keys(globalFilters)) {
        result.push(key, ...globalFilters[key]);
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
          status: keyContactDetails.status || "Active",
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
        status: keyContactDetails.status || null,
        is_primary_contact: keyContactDetails.is_primary_contact || null,
        include_in_communication:
          keyContactDetails.include_in_communication || null,
        entity_rid: project_rid,
        created_by: userId,
        modified_by: userId,
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
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const result = await sequelize.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = :schemaName
            AND table_name = 'project'
        ) AS "exists"
        `,
        {
          replacements: { schemaName },
          type: "SELECT",
        }
      );

      return (result[0] as any).exists === true;
    } catch (err) {
      throw new Error("Error checking schema :" + (err as Error).message);
    }
  }
  async fetchSchemaByUserId(userId: string) {
    try {
      const mainDbInstance = await initMainDbSequelize();

      let account: any[] = await mainDbInstance.query(
        `SELECT rid, r_number, storage_type, parent_account_rid FROM account`,
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

  buildRawWhereClause(where: Record<string, any>, search: string) {
    const fieldAliasMap: Record<string, string> = {
      r_number: "ps.r_number",
      comments: "ps.comments",
      region: "st.rid",
      currency: "curr.rid",
      country: "cou.rid",
      industry_name: "COALESCE(ps.industry_name, ind.industry_name)",
      industry_name_other: "COALESCE(ps.industry_name, ind.industry_name)",
      modified_datetime: "ps.modified_datetime",
      classification_name: "COALESCE(ps.project_classification_other, pc.classification_name)"
    };

    const numberFields = [
      "total_effort",
      "total_cost",
      "fiscal_year",
      "total_fte",
      "total_fte_cost",
      "total_sub_con",
      "total_sub_con_cost",
      "total_non_labor_cost",
      "qualified_research_expenditure",
      "qre",
    ];
    const dateFields = ["project_startdate", "project_enddate", "ps.modified_datetime"];
    const enumFields = ["project_status", "project_type", "fiscal_year", "st.rid", "curr.rid", "cou.rid"];
    const booleanFields = ["is_rd_qualified"];

    const { conditions, replacements } = this.buildWhereCondition(
      where,
      dateFields,
      enumFields,
      booleanFields,
      numberFields,
      fieldAliasMap
    );

    if (search) {
      const numericSearch = !isNaN(parseFloat(search));

      const allProjectFields = [
        "project_code",
        "project_name",
        "fiscal_year",
        "account_name",
        "industry_name_other",
        "project_type",
        "project_client_group",
        "project_group",
        "classification_name",
        "project_status",
        "project_point_of_contact",
        "technical_point_of_contact",
        "r_number",
        "project_number",
        "program_name",
        "project_startdate",
        "project_enddate",
        "qualified_research_expenditure",
        "is_rd_qualified",
        "qre",
        "total_cost",
        "total_effort",
        "total_fte",
        "total_fte_cost",
        "total_sub_con",
        "total_sub_con_cost",
        "total_non_labor_cost",
        "comments",
        "country_name",
        "currency_code",
        "region_name",
        "financial_consultant",
        "modified_datetime"
      ];

      const searchFieldAliasMap: Record<string, string> = {
        r_number: "ps.r_number",
        comments: "ps.comments",
        region_name: "st.state_name",
        industry_name_other: "COALESCE(ind.industry_name, ps.industry_name)",
        project_status: "CAST(ps.project_status AS TEXT)",
        project_type: "CAST(ps.project_type AS TEXT)",
        fiscal_year: "CAST(ps.fiscal_year AS TEXT)",
        is_rd_qualified: "CAST(ps.is_rd_qualified AS TEXT)",
        project_startdate: "CAST(ps.project_startdate AS TEXT)",
        project_enddate: "CAST(ps.project_enddate AS TEXT)",
        total_cost: "CAST(ps.total_cost AS TEXT)",
        total_effort: "CAST(ps.total_effort AS TEXT)",
        total_fte: "CAST(ps.total_fte AS TEXT)",
        total_fte_cost: "CAST(ps.total_fte_cost AS TEXT)",
        total_sub_con: "CAST(ps.total_sub_con AS TEXT)",
        total_sub_con_cost: "CAST(ps.total_sub_con_cost AS TEXT)",
        total_non_labor_cost: "CAST(ps.total_non_labor_cost AS TEXT)",
        qualified_research_expenditure:
          "CAST(ps.qualified_research_expenditure AS TEXT)",
        qre: "CAST(ps.qre AS TEXT)",
      };

      const searchConditions: string[] = [];

      for (const field of allProjectFields) {
        const qualifiedField = searchFieldAliasMap[field] || field;
        searchConditions.push(`${qualifiedField} ILIKE ?`);
        replacements.push(`%${search}%`);
      }

      if (numericSearch) {
        searchConditions.push(
          "ps.total_cost = ?",
          "ps.total_effort = ?",
          "ps.fiscal_year = ?"
        );
        replacements.push(
          parseFloat(search),
          parseFloat(search),
          parseFloat(search)
        );
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
    fieldAliasMap: Record<string, string>
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
          const updatedField = field === "modified_datetime" ? "ps.modified_datetime" : field;
          const normalize = (d: any) => new Date(d);
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
            conditions.push(`(${qualifiedField} != ? OR ${qualifiedField} IS NULL)`);
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
          if (condition.isTrue === true) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(true);
          }
          if (condition.isFalse === true) {
            conditions.push(`${qualifiedField} = ?`);
            replacements.push(false);
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
          `SELECT rid, country_name FROM country WHERE rid IN (:ids)`,
          {
            replacements: { ids: countryIds },
            type: "SELECT",
          }
        );
      }

      if (regionIds.length > 0) {
        states = await mainDdSequilze.query(
          `SELECT rid, state_name FROM state WHERE rid IN (:ids)`,
          {
            replacements: { ids: regionIds },
            type: "SELECT",
          }
        );
      }

      if (currencyIds.length > 0) {
        currencies = await mainDdSequilze.query(
          `SELECT rid, currency_code FROM currency WHERE rid IN (:ids)`,
          {
            replacements: { ids: currencyIds },
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
        ...res.toJSON(),
        country_name: countryMap[res.country]?.country_name || null,
        region_name: regionMap[res.region]?.state_name || null,
        currency_name: currencyMap[res.currency]?.currency_code || null,
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
          `SELECT rid, industry_name FROM industry WHERE rid IN (:ids)`,
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

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDdSequilze.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      const updatedProjects = projects.map((project) => {
        const keyContacts = project.keyContact || [];

        const enrichedKeyContacts = keyContacts.map((kc: any) => ({
          ...kc,
          role_name: keyContactMap[kc.key_contact_role] || null,
        }));

        const technicalConsultant = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === "Technical Consultant" && e.is_primary_contact
        );
        const financialConsultant = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === "Financial Consultant" && e.is_primary_contact
        );
        const pointOfContact = enrichedKeyContacts.find(
          (e: any) =>
            e.role_name === "Project Point of Contact" && e.is_primary_contact
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
          `SELECT industry_name FROM industry WHERE rid = :id`,
          {
            replacements: { id: project.industry_rid },
            type: "SELECT",
          }
        );

        const industry = industryResult[0];
        project.dataValues.industry_name = industry?.industry_name || project.industry_name;
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

      let keyContactMap: Record<string, string> = {};

      if (keyContactIds.length > 0) {
        const keyContactRows = await mainDdSequilze.query(
          `SELECT rid, role_name FROM key_contact_role WHERE rid IN (:ids)`,
          {
            replacements: { ids: keyContactIds },
            type: "SELECT",
          }
        );

        keyContactMap = Object.fromEntries(
          keyContactRows.map((c: any) => [c.rid, c.role_name])
        );
      }

      const enrichedKeyContacts = keyContacts.map((kc: any) => ({
        ...kc,
        role_name: keyContactMap[kc.key_contact_role] || null,
      }));

      return {
        ...project.dataValues,
        keyContact: enrichedKeyContacts,
      };
    } catch (err) {
      throw err;
    }
  }

  async projectClassificationData(project: any, mainDdSequilze: any) {
    try {
      let classificationName = project.project_classification_other;

      if (project && project.project_classification_rid && !project.project_classification_other) {
        const [rows] = await mainDdSequilze.query(
          `SELECT classification_name FROM project_classification WHERE rid = :rid`,
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
        ...(project.dataValues || project),
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
          `SELECT rid, classification_name FROM project_classification WHERE rid IN (:ids)`,
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
          classification_name: res.project_classification_other ? res.project_classification_other :
            classificationMap[res.project_classification_rid]
              ?.classification_name,
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
      "country",
      "region",
      "currency",
      "technical_point_of_contact",
      "financial_consultant",
      "project_point_of_contact",
      "classification_name",
      "industry_name"
    ];

    const enumFields = ["country", "currency", "region"]

    let filteredProjects = [...project];

    const hasValidFilters = filterableClientFields.some((key) => {
      const f = filters?.[key];
      return f && Object.keys(f).some((k) => f[k] !== undefined && f[k] !== null && f[k] !== "");
    });
    
    if (hasValidFilters && filters) {
      filteredProjects = filteredProjects.filter((project) => {
        return filterableClientFields.every((key) => {
          const filter = filters[key];
          if (!filter || Object.keys(filter).length === 0) return true;
    
          const value = project[key];
          const isEnumField = enumFields.includes(key);

          if(isEnumField){
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
          }else{
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
            if (filter.not_contains !== undefined && typeof value === "string") {
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
    try{  
      const mainDbInit = await initMainDbSequelize();

      const createdById = projectData.created_by;
      const modifiedById = projectData.modified_by;

      const getUserFullName = async (userId: string) => {
        if (!userId) return null;

        const [results] = await mainDbInit.query(
          `SELECT first_name, middle_name, last_name FROM "user" WHERE rid = :userId`,
          {
            replacements: { userId },
            type: "SELECT"
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
        modified_name: modifiedName || null
      };
    }catch(err){
      throw new Error("Error adding user details" + (err as Error).message);
    }
  }
}

export default SchemaService;
