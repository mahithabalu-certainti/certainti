import moment, { Moment } from "moment";
import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "../models/resource";
import { ICreateResource, IUpdateResource } from "../utils/types";
import { Sequelize } from "sequelize";
import { ResourceFiscal } from "../models/resourceFiscal";
import { initMainDbSequelize } from "../config/mainDataSource";
import { ResourcesHistory } from "../models/resourceHistory";
import { ResourcesTimeline } from "../models/resourceTimeline";

class SchemaService {
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

      await Resource.sync({ force: false });
      await ResourcesHistoryModel.sync({ force: false });
      await ResourcesTimelineModel.sync({ force: false });
    } catch (err) {
      throw new Error(
        "Error creating table resources: " + (err as Error).message
      );
    }
  }

  async fetchResources(
    accountNumber: string,
    offset: number,
    limit: number,
    order: any[],
    whereClause: Record<string, string> = {}
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);
      const resources = await Resource.findAll({
        where: {
          ...whereClause,
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
          "resource_email",
          "resource_mobile",
          "resource_role",
        ],
      });
      return resources;
    } catch (err) {
      throw new Error(
        "Error creating table resources: " + (err as Error).message
      );
    }
  }

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
          resource_ref_id: resourceData.resource_ref_id,
        },
      });

      if (isRefIdExist) {
        throw new Error("Resource reference ID must be unique.");
      }

      const resourceObject = {
        resource_ref_id: resourceData.resource_ref_id,
        resource_type: resourceData.resource_type,
        fiscal_year: resourceData.fiscal_year,
        resource_firstname: resourceData.first_name || "",
        resource_middlename: resourceData.middle_name || "",
        resource_lastname: resourceData.last_name || "",
        resource_fullname:
          resourceData.full_name ||
          [
            resourceData.first_name,
            resourceData.middle_name,
            resourceData.last_name,
          ]
            .filter(Boolean)
            .join(" "),
        resource_status: resourceData.resource_status,
        resource_email: resourceData.email || "",
        resource_mobile: resourceData.mobile || "",
        resource_orgname: resourceData.org_name || "",
        resource_startdate: startDate.toDate() || null,
        resource_enddate: endDate.toDate() || null,
        resource_role: resourceData.role || "",
        region: resourceData.region || "",
        country: resourceData.country || "",
        currency: resourceData.currency || "",
        designation: resourceData.designation || "",
        manager_name: resourceData.manager_name || "",
        total_years_experience: resourceData.total_years_experience || null,
        total_years_in_org: resourceData.total_years_in_org || null,
        cost_frequency: resourceData.cost_frequencty,
        cost: resourceData.cost,
        created_by: resourceData.created_by,
        modified_by: resourceData.modified_by,
        account_rid: resourceData.account_id,
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
        "Error inserting records into resources :" + (err as Error).message
      );
    }
  }

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
        country_rid: resourceData.country || "",
        country_region_rid: resourceData.region || "",
        effective_date: startDate.toDate(),
        end_date: endDate.toDate(),
        currency_rid: resourceData.currency || "",
        created_by: resourceData.created_by,
      });
    } catch (err) {
      throw new Error(
        "Error inserting records into resources fiscal :" +
          (err as Error).message
      );
    }
  }

  async checkIfResourceExists(
    resourceId: string,
    accountNumber: string
  ): Promise<boolean> {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);

      const resource = await Resource.findOne({
        where: {
          rid: resourceId,
        },
      });

      return resource !== null;
    } catch (err) {
      throw new Error(
        "Error checking if resource exists: " + (err as Error).message
      );
    }
  }

  async updateResource(
    resourceData: IUpdateResource,
    accountNumber: string,
    accountId: string
  ) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);

      const startDate = moment(resourceData.effective_from_date, "DD/MM/YYYY");
      const endDate = moment(resourceData.effective_end_date, "DD/MM/YYYY");

      const existingResourceData = await Resource.findOne({
        where: {
          rid: resourceData.resource_id,
        },
      });

      const updateResourceObject: any = {
        resource_fullname:
          resourceData.full_name ||
          [
            resourceData.first_name,
            resourceData.middle_name,
            resourceData.last_name,
          ]
            .filter(Boolean)
            .join(" "),
        resource_firstname: resourceData.first_name || "",
        resource_middlename: resourceData.middle_name || "",
        resource_lastname: resourceData.last_name || "",
        resource_orgname: resourceData.org_name || "",
        resource_role: resourceData.role || "",
        resource_type: resourceData.resource_type || "",
        resource_status: resourceData.resource_status,
        resource_email: resourceData.email || "",
        resource_mobile: resourceData.mobile || "",
        country: resourceData.country || "",
        currency: resourceData.currency || "",
        region: resourceData.region || "",
        cost_frequency: resourceData.cost_frequency,
        cost: resourceData.cost,
        resource_startdate: startDate.toDate() || null,
        resource_enddate: endDate.toDate() || null,
        manager_name: resourceData.manager_name || "",
        designation: resourceData.designation || "",
        resource_desc: resourceData.description || "",
        total_years_experience: resourceData.total_years_experience || null,
        total_years_in_org: resourceData.total_years_in_org || null,
        fiscal_year: resourceData.fiscal_year,
        modified_by: resourceData.modified_by,
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
          country_rid: resourceData.country || "",
          country_region_rid: resourceData.region || "",
          effective_date: startDate.toDate(),
          end_date: endDate.toDate(),
          currency_rid: resourceData.currency || "",
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

  async resourceDetails(accountNumber: string, resourceId: string) {
    try {
      const schemaName = `platform_v2_${accountNumber}`;
      const sequelize = await initOrgSequelize();
      const mainDbSequelize = await initMainDbSequelize();

      const ResourcesModel = await Resources.initialize(sequelize, schemaName);

      const resource = await ResourcesModel.findOne({
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
        const [currency]: any[] = await mainDbSequelize.query(
          `SELECT currency_code FROM currency WHERE rid = :rid`,
          {
            replacements: { rid: resource.currency },
            type: "SELECT",
          }
        );
        const [region]: any[] = await mainDbSequelize.query(
          `SELECT region_name FROM regions WHERE rid = :rid`,
          {
            replacements: { rid: resource.region },
            type: "SELECT",
          }
        );

        (resource as any).dataValues.country_code =
          country?.country_code || null;
        (resource as any).dataValues.currency_code =
          currency?.currency_code || null;
        (resource as any).dataValues.region_name = region?.region_name || null;
      }

      return resource;
    } catch (err) {
      throw new Error(
        "Error fetching resource details : " + (err as Error).message
      );
    }
  }

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
}

export default SchemaService;
