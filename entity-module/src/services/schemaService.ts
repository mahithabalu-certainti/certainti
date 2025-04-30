import moment, { Moment } from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "../models/resource";
import { ICreateResource, IUpdateResource } from "../utils/types";
import { Op, Sequelize } from "sequelize";
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

      const ResourceCostModel = await ResourceCost.initialize(sequelize, schemaName);
      const SkillModel = await Skill.initialize(sequelize, schemaName);
      const ResourceSkillModel = await ResourceSkill.initialize(sequelize, schemaName);

      await Resource.sync({ force: false });
      await ResourcesHistoryModel.sync({ force: false });
      await ResourcesTimelineModel.sync({ force: false });
      await ResourceCostModel.sync({ force: false });
      await SkillModel.sync({ force: false });
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
    goeDataFilters: Record<string, any> = {},
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
          ...(fiscalYear && fiscalYear !== 0 ? { fiscal_year: fiscalYear } : {})
        },
        limit,
        offset,
        order,
        subQuery: false,
        attributes: [
          "rid",
          "r_number",
          "resource_ref_id",
          "resource_fullname",
          "resource_type",
          "resource_status",
          "resource_role",
          "designation",
          "total_years_experience",
          "country",
          "state",
          "city",
        ],
      });

      const totalCount = await Resource.count({
        where: {
          ...whereClause,
          ...(fiscalYear && fiscalYear !== 0 ? { fiscal_year: fiscalYear } : {})
        },
      });

      if (resources) {
        finalResources = await this.insertGeoData(resources, mainDdSequilze);
        finalResources = await this.sortAndFilteGeoData(
          finalResources,
          goeDataFilters,
          geoDataSort
        );
      }

      return { resources: finalResources, totalCount };
    } catch (err) {
      throw new Error(
        "Error fetching resources: " + (err as Error).message
      );
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
        fiscal_year: resourceData.fiscal_year,
        resource_fullname: resourceData.full_name || null,
        resource_status: resourceData.resource_status,
        resource_orgname: resourceData.org_name || null,
        resource_startdate: moment(startDate).isValid() ? moment(startDate).toDate() : null,
        resource_enddate: moment(endDate).isValid() ? moment(endDate).toDate() : null,
        resource_role: resourceData.role || null,
        state: resourceData.state || null,
        country: resourceData.country || null,
        city: resourceData.city || null,
        designation: resourceData.designation || null,
        total_years_experience: resourceData.total_years_experience || 0,
        total_years_in_org: resourceData.total_years_in_org || 0,
        created_by: resourceData.created_by,
        modified_by: resourceData.modified_by,
        account_rid: resourceData.account_id,
        comments: resourceData.comments || ""
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
      throw new Error(
        (err as Error).message
      );
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
        fiscal_year: resourceData.fiscal_year,
        country_rid: resourceData.country || null,
        country_region_rid: resourceData.state || null,
        effective_date: moment(startDate).isValid() ? moment(startDate).toDate() : null,
        end_date: moment(endDate).isValid() ? moment(startDate).toDate() : null,
        created_by: resourceData.created_by,
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
        throw new Error('Resource ID and account number are required');
      }

      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      // Verify schema exists before querying
      const schemaExists = await sequelize.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = :schemaName`,
        {
          replacements: { schemaName },
          type: "SELECT"
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
          lock: true
        });
      });

      return resource !== null;
    } catch (err) {
      // Log error for debugging
      console.error('Resource existence check failed:', err);
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
      const startDate = moment.utc(resourceData.effective_from_date, "MM/DD/YYYY").startOf('day');
      const endDate = moment.utc(resourceData.effective_end_date, "MM/DD/YYYY").startOf('day');

      const existingResourceData = await Resource.findOne({
        where: {
          rid: resourceData.resource_id,
        },
      });

      const updateResourceObject: any = {
        resource_fullname: resourceData.full_name || null,
        resource_orgname: resourceData.org_name || null,
        resource_role: resourceData.role || null,
        resource_type: resourceData.resource_type || "",
        resource_status: resourceData.resource_status,
        country: resourceData.country || null,
        state: resourceData.state || null,
        city: resourceData.city || null,
        resource_startdate: moment(startDate).isValid() ? moment(startDate).toDate() : null,
        resource_enddate: moment(endDate).isValid() ? moment(endDate).toDate() : null,
        designation: resourceData.designation || null,
        total_years_experience: resourceData.total_years_experience || null,
        total_years_in_org: resourceData.total_years_in_org || null,
        fiscal_year: resourceData.fiscal_year,
        modified_by: resourceData.modified_by,
        comments: resourceData.comments || ""
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
          fiscal_year: resourceData.fiscal_year,
          country_rid: resourceData.country || null,
          country_region_rid: resourceData.state || null,
          effective_date: moment(startDate).isValid() ? moment(startDate).toDate() : null,
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

      let resource:any = await ResourcesModel.findOne({
        where: {
          rid: resourceId,
        },
      });

      if (resource) {
        const [country]: any[] = await mainDbSequelize.query(
          `SELECT country_code FROM country WHERE rid = :rid`,
          {
            replacements: { rid: resource.country },
            type: "SELECT",
          }
        );
        const [state]: any[] = await mainDbSequelize.query(
          `SELECT state_name FROM state WHERE rid = :rid`,
          {
            replacements: { rid: resource.state },
            type: "SELECT",
          }
        );
        const [city]: any[] = await mainDbSequelize.query(
          `SELECT city_name FROM city WHERE rid = :rid`,
          {
            replacements: { rid: resource.city },
            type: "SELECT",
          }
        );

        (resource as any).dataValues.country_code =
          country?.country_code || null;
        (resource as any).dataValues.state_name = state?.state_name || null;
        (resource as any).dataValues.city_name = city?.city_name || null;
        //Added to format date as MM/DD/YYYY
        resource = {
          ...resource.toJSON(),
          resource_startdate: resource.resource_startdate ? moment(resource.resource_startdate).format('MM/DD/YYYY') : null,
          resource_enddate: resource.resource_enddate ? moment(resource.resource_enddate).format('MM/DD/YYYY') : null,
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
      const countryIds = [...new Set(resources.map((r: any) => r.country))].filter(Boolean);
      const stateIds = [...new Set(resources.map((r: any) => r.state))].filter(Boolean);
      const cityIds = [...new Set(resources.map((r: any) => r.city))].filter(Boolean);
  
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
  
      if (stateIds.length > 0) {
        states = await mainDdSequilze.query(
          `SELECT rid, state_name FROM state WHERE rid IN (:ids)`,
          {
            replacements: { ids: stateIds },
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
  
      const statesMap = Object.fromEntries(
        (Array.isArray(states) ? states : []).map((s: any) => [s.rid, s])
      );
  
      const cityMap = Object.fromEntries(
        (Array.isArray(cities) ? cities : []).map((s: any) => [
          s.rid,
          s,
        ])
      );
  
      const updatedResources = resources.map((res: any) => ({
        ...res.toJSON(),
        country_name: countryMap[res.country]?.country_name || null,
        state_name: statesMap[res.state]?.state_name || null,
        city_name: cityMap[res.city]?.city_name || null,
      }));
  
      return updatedResources;
    } catch (err) {
      throw new Error("Error fetching geo data: " + (err as Error).message);
    }
  }
  

  async sortAndFilteGeoData(
    resources: any[],
    whereClause: Record<string, any> = {},
    order: string[][] = []
  ): Promise<any[]> {
    const updatedResources = resources
      .filter((res) => {

        if (whereClause.city && !this.applyTextFilter(res.city_name, whereClause.city)) {
          return false;
        }
  
        if (whereClause.country && !this.applyTextFilter(res.country_name, whereClause.country)) {
          return false; 
        }
  
        if (whereClause.state && !this.applyTextFilter(res.state_name, whereClause.state)) {
          return false;
        }
  
        return true;
        // if (
        //   whereClause.city?.length &&
        //   !whereClause.city.some((c: any) =>
        //     res.city_name?.toLowerCase().includes(c.toLowerCase())
        //   )
        // ) {
        //   return false;
        // }
      
        // if (
        //   whereClause.country?.length &&
        //   !whereClause.country.some((c: any) =>
        //     res.country_name?.toLowerCase().includes(c.toLowerCase())
        //   )
        // ) {
        //   return false;
        // }
      
        // if (
        //   whereClause.state?.length &&
        //   !whereClause.state.some((r: any) =>
        //     res.state_name?.toLowerCase().includes(r.toLowerCase())
        //   )
        // ) {
        //   return false;
        // }
        // return true;
      })
      .sort((a, b) => {
        const [field, direction] = order[0] || [];
        const dir = direction === "ASC" ? 1 : -1;

        if (field === "country") {
          return (
            (a.country_name || "").localeCompare(b.country_name || "") * dir
          );
        }
        if (field === "state") {
          return (a.state_name || "").localeCompare(b.state_name || "") * dir;
        }

        if (field === "city") {
          return (
            (a.city_name || "").localeCompare(b.city_name || "") * dir
          );
        }

        return 0;
      });

    return updatedResources;
  }

  applyTextFilter(value: string | null | undefined, filter: any): boolean {
    const val = (value || "").toLowerCase();

    if (filter?.contains && !val.includes(filter.contains.toLowerCase())) {
      return false;
    }

    if (filter?.notContains && val.includes(filter.notContains.toLowerCase())) {
      return false;
    }

    if (filter?.equals && val !== filter.equals.toLowerCase()) {
      return false;
    }

    if (filter?.notEqual && val === filter.notEqual.toLowerCase()) {
      return false;
    }

    if (filter?.isEmpty === true && val.trim() !== "" && !val.trim() !== null) {
      return false;
    }

    return true;
  };
}

export default SchemaService;
