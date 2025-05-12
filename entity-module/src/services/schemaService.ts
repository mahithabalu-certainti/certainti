import moment, { Moment } from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "../models/resource";
import { ICreateResource, IKeyContactDetail, IUpdateResource } from "../utils/types";
import { DataTypes, Op, Sequelize } from "sequelize";
import { ResourceFiscal } from "../models/resourceFiscal";
import { initMainDbSequelize } from "../config/mainDataSource";
import { ResourcesHistory } from "../models/resourceHistory";
import { ResourcesTimeline } from "../models/resourceTimeline";
import { ResourceCost } from "../models/resourceCost";
import { ResourceSkill } from "../models/resourceSkill";
import { Skill } from "../models/skill";

class SchemaService {
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
      const SkillModel = await Skill.initialize(sequelize, schemaName);
      const ResourceSkillModel = await ResourceSkill.initialize(
        sequelize,
        schemaName
      );

      await Resource.sync({ force: false });
      await ResourcesHistoryModel.sync({ force: false });
      await ResourcesTimelineModel.sync({ force: false });
      await ResourceCostModel.sync({ force: false });
      // await SkillModel.sync({ force: false });
      await ResourceSkillModel.sync({ force: false });
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
    fiscalYear: number,
    geoDataSort: string[][]
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

      if (isResourceTypeSort) {
        const direction =
          order[0][1]?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        queryOrder = [
          [
            Sequelize.literal(`
            CASE resource_type
              WHEN 'Full-Time' THEN 1
              WHEN 'Non-Labor' THEN 2 
              WHEN 'Sub Con' THEN 3
              ELSE 4
            END
          `),
            direction,
          ],
        ];
      }

      // First get all resources without pagination
      const resources = await Resource.findAll({
        where: {
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
        order: queryOrder,
        subQuery: false,
        attributes: [
          "rid",
          "r_number",
          "resource_ref_id",
          "resource_fullname",
          "resource_type",
          "resource_status",
          "resource_role",
          "resource_designation",
          "resource_total_experience",
          "resource_country",
          "resource_region", 
          "resource_city",
        ],
      });

      if (resources) {
        // Process geo data for all records
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortGeoData(
          finalResources,
          geoDataSort
        );

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
          resource_ref_id: {
            [Op.iLike]: resourceData.resource_ref_id,
          },
        },
      });

      if (isRefIdExist) {
        throw new Error("Resource ref ID must be unique.");
      }

      const resourceObject = {
        resource_ref_id: resourceData.resource_ref_id,
        resource_type: resourceData.resource_type,
        resource_fullname: resourceData.full_name || null,
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
        resource_total_experience_organization: resourceData.total_years_in_org || 0,
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
          resourceData.account_number,
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
    fiscalYear: number,
    geoDataSort: string[][]
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();
      const mainDdSequilze = await initMainDbSequelize();
      let finalResources = null;

      const Resource = Resources.initialize(sequelize, schemaName);
      await Resource.sync({ force: false });
      const resources = await Resource.findAll({
        where: {
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
        order,
        subQuery: false,
        attributes: [
          "rid",
          "r_number",
          "resource_ref_id",
          "resource_fullname",
          "resource_firstname",
          "resource_lastname",
          "resource_type",
          "resource_status",
          "resource_role",
          "resource_designation",
          "resource_total_experience",
          "resource_country",
          "resource_region",
          "resource_city",
        ],
      });

      const totalCount = await Resource.count({
        where: {
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0
            ? { fiscal_year: fiscalYear }
            : {}),
        },
      });

      if (resources) {
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortGeoData(
          finalResources,
          geoDataSort
        );
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
        created_by: resourceData.created_by || '',
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

      // Parse dates and set to UTC midnight to avoid timezone issues
      const startDate = moment
        .utc(resourceData.effective_from_date, "MM/DD/YYYY")
        .startOf("day");
      const endDate = moment
        .utc(resourceData.effective_end_date, "MM/DD/YYYY")
        .startOf("day");

      const existingResourceData = await Resource.findOne({
        where: {
          rid: resourceData.resource_id,
        },
      });

      const updateResourceObject: any = {
        resource_fullname: resourceData.full_name || null,
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
        resource_total_experience_organization: resourceData.total_years_in_org || null,
        modified_by: resourceData.modified_by,
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
      throw new Error("Error updating resource: " + (err as Error).message);
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

        (resource as any).dataValues.country_code = country?.country_code || null;
        (resource as any).dataValues.country_name = country?.country_name || null;
        (resource as any).dataValues.region_name = state?.state_name || null;
        (resource as any).dataValues.city_name = city?.city_name || null;
        //Added to format date as MM/DD/YYYY
        resource = {
          ...resource.toJSON(),
          resource_startdate: resource.resource_startdate
            ? moment(resource.resource_startdate).format("MM/DD/YYYY")
            : null,
          resource_enddate: resource.resource_enddate
            ? moment(resource.resource_enddate).format("MM/DD/YYYY")
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
      const regionIds = [...new Set(resources.map((r: any) => r.resource_region))].filter(
        Boolean
      );
      const cityIds = [...new Set(resources.map((r: any) => r.resource_city))].filter(
        Boolean
      );

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

  async sortGeoData(
    resources: any[],
    order: string[][] = []
): Promise<any[]> {

    // Apply sorting if specified
    if (order && order.length > 0) {
      const [sortField, sortDirection] = order[0];
      const isAsc = sortDirection.toUpperCase() === 'ASC';

      resources = resources.sort((a, b) => {
        let compareValueA, compareValueB;

        switch (sortField) {
          case 'resource_country':
            compareValueA = a.country_name || '';
            compareValueB = b.country_name || '';
            break;
          case 'resource_region':
            compareValueA = a.region_name || '';
            compareValueB = b.region_name || '';
            break;
          default:
            return 0;
        }

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

  async insertProjectGeoData(project: any, mainDdSequilze: Sequelize,keyContacts:any) {
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
          `SELECT rid, currency_name FROM currency WHERE rid = :id`,
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
        key_contacts:keyContacts,
        country_name: countryRow?.country_name || null,
        state_name: regionRow?.region_name || null,
        city_name: currencyRow?.currency_name || null,
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
    accountMeta: Array<{
      rid: string;
      r_number: string;
      storage_type: string;
      parent_account_rid: string | null;
    }>
  ) {
    try {
      const orgDbSequelize = await initOrgSequelize();
      const TempTableModel = await this.createTempProjectTable(orgDbSequelize);
      await TempTableModel.sync({ force: true });

      if (accountMeta.length > 0) {
        for (const acc of accountMeta) {
          const schema = `platform_v2_${acc.r_number}`;
          await this.insertIntoTempFromSchema(
            orgDbSequelize,
            TempTableModel,
            schema,
            fiscalYear,
            acc.rid,
            [],
          );
        }
      } else {
        const schemas: any = await orgDbSequelize.query(
          `
          SELECT DISTINCT table_schema
          FROM information_schema.tables
          WHERE table_name = 'project'
            AND table_type = 'BASE TABLE'
            AND table_schema LIKE 'platform_v2_%'
          `,
          { type: "SELECT" }
        );

        for (const { table_schema } of schemas) {
          await this.insertIntoTempFromSchema(
            orgDbSequelize,
            TempTableModel,
            table_schema,
            fiscalYear
          );
        }
      }

      const { rows: finalResult, count } = await TempTableModel.findAndCountAll(
        {
          where: {
            ...whereClause,
            ...(fiscalYear && fiscalYear !== 0
              ? { fiscal_year: fiscalYear }
              : {}),
          },
          order: [[sort.sortCol, sort.sortOrder.toUpperCase()]],
          offset,
          limit,
        }
      );

      return {
        finalResult,
        totalCount: count,
      };
    } catch (err) {
      throw new Error("Error fetching Accounts: " + (err as Error).message);
    }
  }

  async createTempProjectTable(dbInstance: Sequelize) {
    try {
      const TempProject = dbInstance.define(
        "temp_project_data",
        {
          rid: DataTypes.UUID,
          r_number: DataTypes.TEXT,
          project_ref_id: DataTypes.TEXT,
          industry_rid: DataTypes.UUID,
          industry_name: DataTypes.TEXT,
          project_name: DataTypes.TEXT,
          project_description: DataTypes.TEXT,
          project_manager: DataTypes.TEXT,
          project_lead: DataTypes.TEXT,
          total_effort: DataTypes.DOUBLE,
          total_cost: DataTypes.DECIMAL(13, 2),
          spoc_name: DataTypes.TEXT,
          spoc_email: DataTypes.TEXT,
          project_status: DataTypes.TEXT,
          project_startdate: DataTypes.DATEONLY,
          project_enddate: DataTypes.DATEONLY,
          created_datetime: DataTypes.DATEONLY,
          created_by: DataTypes.UUID,
          fiscal_year: DataTypes.INTEGER,
          account_rid: DataTypes.UUID,
          source_schema: DataTypes.TEXT,
        },
        {
          tableName: "temp_project_data",
          timestamps: false,
        }
      );
      return TempProject;
    } catch (err) {
      throw new Error("Error creating temp project table");
    }
  }

  async computeGlobalAccountFilter(globalFilters: Record<string, string[]>) {
    try {
      const mainDbSequelize = await initMainDbSequelize();
      const accountIds = new Set<string>();

      for (const value of Object.values(globalFilters)) {
        value.forEach((id) => accountIds.add(id));
      }

      const accountIdArray = Array.from(accountIds);

      if (accountIdArray.length === 0) {
        return [];
      }

      const placeholders = accountIdArray.map((_, i) => `:id${i}`).join(", ");
      const replacements = Object.fromEntries(
        accountIdArray.map((id, i) => [`id${i}`, id])
      );

      const accounts = await mainDbSequelize.query(
        `
        SELECT rid, r_number, storage_type, parent_account_rid
        FROM account
        WHERE rid IN (${placeholders})
        `,
        {
          replacements,
          type: "SELECT",
        }
      );

      if (accounts && accounts.length > 0) {
        for (const val of accounts as any[]) {
          if (val.storage_type === "store_in_parent") {
            const accountById = await this.fetchAccountById(
              val.parent_account_rid
            );
            if (accountById) {
              val.r_number = accountById.r_number;
            }
          }
        }
      }

      return accounts as {
        rid: string;
        r_number: string;
        storage_type: string;
        parent_account_rid: string | null;
      }[];
    } catch (err) {
      throw new Error("Error computing global account filter");
    }
  }

  private async insertIntoTempFromSchema(
    sequelizeInstance: any,
    TempTableModel: any,
    schema: string,
    fiscalYear: number,
    accountId?: string,
    filterAccountRids?: string[]
  ) {
    const [{ exists }] = await sequelizeInstance.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_schema = :schema 
        AND table_name = 'project'
      ) as exists
      `,
      {
        replacements: { schema },
        type: "SELECT",
      }
    );

    if (!exists) {
      return;
    }

    let baseQuery = `
      INSERT INTO temp_project_data (
        rid, r_number, project_ref_id, industry_rid,industry_name, project_name, project_description,
        project_manager, project_lead, total_effort, total_cost, spoc_name,
        spoc_email, project_status, project_startdate, project_enddate, created_datetime,
        created_by, fiscal_year, account_rid, source_schema
      )
      SELECT 
        rid, r_number, project_ref_id, industry_rid,industry_name project_name, project_description,
        project_manager, project_lead, total_effort, total_cost, spoc_name,
        spoc_email, project_status, project_startdate, project_enddate, created_datetime,
        created_by, fiscal_year, account_rid, :schemaName
      FROM "${schema}"."project"
    `;

    const conditions: string[] = [];
    const replacements: Record<string, any> = { schemaName: schema };

    if (fiscalYear !== 0) {
      conditions.push(`fiscal_year = :fiscalYear`);
      replacements.fiscalYear = fiscalYear;
    }

    if(accountId){
      conditions.push(`account_rid = :fiscalYear`);
      replacements.fiscalYear = accountId;
    }

    if (filterAccountRids && filterAccountRids.length > 0) {
      const placeholders = filterAccountRids.map((_, i) => `:acc${i}`);
      conditions.push(`account_rid IN (${placeholders.join(", ")})`);
      filterAccountRids.forEach((id, i) => {
        replacements[`acc${i}`] = id;
      });
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`;
    }

    await sequelizeInstance.query(baseQuery, {
      replacements,
    });
  }

  async manageKeyContacts(
    key_contacts: IKeyContactDetail,
    account_rid: string,
    projectId: string,
    userId: string
  ) {
    
  try {
    for (const contact of Object.values(key_contacts)) {
      console.log("action",contact.action_type)
      if(contact.action_type === 'edit')
      {
        if (contact.key_contact_name || contact.key_contact_email || contact.key_contact_role_rid) {
          this.updateKeyContactDetails(
            contact,
            account_rid,
            projectId,
            userId
          )
        }
      }
      else if(contact.action_type === 'delete')
      {
        {
          this.deleteKeyContactDetails(
            account_rid,
            projectId,
            contact.key_contact_id
          )
        }
      }
      else if(contact.action_type === 'add')
      {
        if (contact.key_contact_name || contact.key_contact_email || contact.key_contact_role_rid) {
        this.insertKeyContactDetails(
          contact,
          account_rid,
          projectId,
          userId
        )
      }
      }
    }
  }
    catch(Error)
    {
      console.log(Error)
    }
  }
  async deleteKeyContactDetails(account_rid: string,key_contact_id: string,project_rid:string){
    const sequelize = await initOrgSequelize();
    await sequelize.query(
      `DELETE FROM "public"."key_contact_details" 
       WHERE key_contact_id = :key_contact_id AND account_rid = :account_rid and project_rid = :project_rid and contact_type = 'Project'`,
      {
        replacements: {
          key_contact_id,
          account_rid,
          project_rid
        }
      }
    );
  }
  async updateKeyContactDetails(
    key_contact: IKeyContactDetail,
    account_rid: string,
    project_rid:string,
    userId: string,
) {
  const keyContactDetails = key_contact;
      const sequelize = await initOrgSequelize();
      try {

        await sequelize.query(
          `
            UPDATE "public"."key_contact_details"
            SET 
              key_contact_name = :key_contact_name,
              key_contact_email = :key_contact_email,
              key_contact_role_rid = :key_contact_role_rid,
              status = :status,
              is_primary_contact = :is_primary_contact,
              include_in_communication = :include_in_communication,
              modified_by = :modified_by
            WHERE account_rid = :account_rid
            AND key_contact_id = :key_contact_id
            AND project_rid = :project_rid
            AND contact_type = 'Project'
          `,
          {
            replacements: {
              key_contact_id: keyContactDetails.key_contact_id,
              account_rid: account_rid,
              project_rid:project_rid,
              key_contact_name: keyContactDetails.key_contact_name,
              key_contact_email: keyContactDetails.key_contact_email,
              key_contact_role_rid: keyContactDetails.key_contact_role_rid,
              status: keyContactDetails.status,
              is_primary_contact: keyContactDetails.is_primary_contact,
              include_in_communication: keyContactDetails.include_in_communication,
              modified_by: userId
            },
          }
        );
      } catch (error) {
        console.error("Error updating key contact details:", error);
        throw error;
      }
  }
  
  async insertKeyContactDetails(
    keyContacts: IKeyContactDetail,
    account_rid: string,
    project_rid: string,
    userId: string,
  ) {
    const keyContactDetails = keyContacts;
    const sequelize = await initOrgSequelize();
    try {
      const result = await sequelize.query(
        `SELECT key_contact_id FROM "public"."key_contact_details" 
         ORDER BY key_contact_id DESC LIMIT 1;`,
        {
          type: "SELECT",
          plain: true,
        }
      ) as { key_contact_id: string };
  
      const keyContactId = result?.key_contact_id ?? '';
      let lastKeyId = keyContactId.startsWith('KEY') ? parseInt(keyContactId.replace("KEY", "")) : 0;
      
      // Since keyContactDetails is a single object, not an array
      lastKeyId++;
      const key_contact_id = `KEY${String(lastKeyId).padStart(3, '0')}`;
      
      await sequelize.query(
        `INSERT INTO "public"."key_contact_details" (
          key_contact_id, account_rid, key_contact_name, project_rid,
          key_contact_email, key_contact_role_rid, status, 
          is_primary_contact, include_in_communication, 
          created_by, modified_by, contact_type
        ) VALUES (
          :key_contact_id, :account_rid, :key_contact_name, :project_rid,
          :key_contact_email, :key_contact_role_rid, :status, 
          :is_primary_contact, :include_in_communication, 
          :created_by, :modified_by, 'Project'
        )`,
        {
          replacements: {
            key_contact_id,
            account_rid,
            project_rid,
            key_contact_name: keyContactDetails.key_contact_name,
            key_contact_email: keyContactDetails.key_contact_email,
            key_contact_role_rid: keyContactDetails.key_contact_role_rid,
            status: keyContactDetails.status,
            is_primary_contact: keyContactDetails.is_primary_contact,
            include_in_communication: keyContactDetails.include_in_communication,
            created_by: userId,
            modified_by: userId
          }
        }
      );
    } catch (error) {
      console.error("Error inserting key contact details:", error);
      throw error;
    }
  }

  async fetchKeyContacts(account_rid: string,project_rid:string) {
    const sequelize = await initOrgSequelize();
    return await sequelize.query(
      `SELECT * FROM "public"."key_contact_details" WHERE account_rid = :account_rid
      and project_rid = :project_rid and contact_type = 'Project'`,
      {
        type: "SELECT",
        replacements: { account_rid,project_rid },
      }
    );
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
  
}

export default SchemaService;
