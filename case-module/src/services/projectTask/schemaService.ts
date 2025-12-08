import { Op, Sequelize, Transaction } from "sequelize";
import { initOrgSequelize } from "../../config/orgDataSource";
import { initMainDbSequelize } from "../../config/mainDataSource";

// import AccountDetails from "../../models/accountDetails";
import { ProjectFiscal } from "../../models/projectFiscal";
import { Resources } from "../../models/resource";
import { ProjectResourceFiscal } from "../../models/projectResourceFiscal";

import { MAIN_SCHEMA_NAME, SCHEMANAME_PREFIX, rawQueries } from "../../utils/constants";

import { logMessage, errorLog } from "../../utils/helpers";
import { CaseProjectTask } from "../../models/caseProjectTaskModel";

export class ProjectTaskSchemaService {
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  private modelCache: Map<
    string,
    {
      ProjectFiscal: ReturnType<typeof ProjectFiscal.initialize>;
      CaseProjectTask: ReturnType<typeof CaseProjectTask.initialize>;
      ProjectResourceFiscal: ReturnType<
        typeof ProjectResourceFiscal.initialize
      >;
      Resources: ReturnType<typeof Resources.initialize>;
    }
  > = new Map();

  constructor() { }

  async getSequelize(): Promise<Sequelize> {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  private async getMainSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getModels(accountNumber: string) {
    const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;

    const sequelize = await this.getSequelize();
    this.mainDbSequelize = await this.getMainSequelize();

    // const AccountDetailsModel = AccountDetails.initialize(
    //   sequelize,
    //   schemaName
    // );
    // const AccountFiscalModel = AccountFiscal.initialize(sequelize, schemaName);
    // const AccountFiscalRegionModel = AccountFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectModel = Project.initialize(sequelize, schemaName);
    const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
    // const ProjectFiscalRegionModel = ProjectFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );

    const ResourceModel = Resources.initialize(sequelize, schemaName);

    const CaseProjectTaskModel = await CaseProjectTask.initialize(
      sequelize,
      schemaName
    );
    // const ProjectTaskHistoryModel = await ProjectTaskHistory.initialize(
    //   sequelize,
    //   schemaName
    // );

    // const ProjectResourceModel = await ProjectResource.initialize(
    //   sequelize,
    //   schemaName
    // );
    const ProjectResourceFiscalModel = await ProjectResourceFiscal.initialize(
      sequelize,
      schemaName
    );
    // const ProjectResourceFiscalRegionModel =
    //   await ProjectResourceFiscalRegion.initialize(sequelize, schemaName);

    const ResourcesModel = await Resources.initialize(sequelize, schemaName);
    // const ResourcesFiscalModel = await ResourceFiscal.initialize(
    //   sequelize,
    //   schemaName
    // );
    // const ResourceFiscalRegionModel = await ResourceFiscalRegion.initialize(
    //   sequelize,
    //   schemaName
    // );

    // CaseProjectTaskModel.belongsTo(AccountDetailsModel, {
    //   foreignKey: "account_rid",
    //   targetKey: "account_rid",
    //   as: "account",
    // });

    // CaseProjectTaskModel.belongsTo(ProjectModel, {
    //   foreignKey: "project_fiscal_rid",
    //   targetKey: "rid",
    //   as: "project_task_project",
    // });

    CaseProjectTaskModel.belongsTo(ProjectFiscalModel, {
      foreignKey: "project_fiscal_rid",
      targetKey: "rid",
      as: "project",
    });

    CaseProjectTaskModel.belongsTo(ResourceModel, {
      foreignKey: "resource_rid",
      targetKey: "rid",
      as: "resource",
    });

    // CaseProjectTaskModel.belongsTo(ProjectResourceModel, {
    //   foreignKey: "project_resource_rid",
    //   targetKey: "rid",
    //   as: "project_resource",
    // });

    // ProjectTaskHistoryModel.belongsTo(CaseProjectTaskModel, {
    //   foreignKey: "project_task_rid",
    //   targetKey: "rid",
    //   as: "project_task_history_project_task",
    // });

    const models = {
      CaseProjectTask: CaseProjectTaskModel,
      ProjectResourceFiscal: ProjectResourceFiscalModel,
      // ProjectResourceFiscalRegion: ProjectResourceFiscalRegionModel,
      // ResourceFiscal: ResourcesFiscalModel,
      // ResourceFiscalRegion: ResourceFiscalRegionModel,
      // ProjectTaskHistory: ProjectTaskHistoryModel,
      // ProjectResource: ProjectResourceModel,
      ProjectFiscal: ProjectFiscalModel,
      Resources: ResourcesModel,
      //   ProjectFiscalRegion: ProjectFiscalRegionModel,
      //   Project: ProjectModel,
      //   AccountFiscal: AccountFiscalModel,
      //   AccountFiscalRegion: AccountFiscalRegionModel,
    };
    this.modelCache.set(schemaName, models);
    return models;
  }



  async validateProjectTaskById(
    accountNumber: string,
    projectTaskId: string,
    accountId: string
  ) {
    const { CaseProjectTask } = await this.getModels(accountNumber);

    const projectTaskData = await CaseProjectTask.findOne({
      where: {
        rid: projectTaskId,
        account_rid: accountId,
      },
    });

    if (!projectTaskData) {
      logMessage("Case project task does not exist for the given account");
      throw new Error("Case project task does not exist for the given account");
    }

    return projectTaskData;
  }

  async findDuplicateTask(
    accountNumber: string,
    resource_rid: string | undefined,
    start_date: Date | null,
    end_date: Date | null,
    statusMap: Map<string, string> | null,
    comments: string | null | undefined,
    account_rid: string,
    project_fiscal_rid: string,
    costValues: any
  ) {
    const { CaseProjectTask } = await this.getModels(accountNumber);
    const existingCost = await CaseProjectTask.findOne({
      where: {
        resource_rid: resource_rid,
        start_date: start_date,
        end_date: end_date,
        ...costValues,
        status_rid: {
          [Op.in]: [
            statusMap?.get('Active'),
            statusMap?.get('Anomaly'),
            statusMap?.get('Duplicate')
          ].filter(Boolean) as string[]
        },
        comments: comments,
        account_rid: account_rid,
        project_fiscal_rid: project_fiscal_rid
      },
    });
    return existingCost;
  }

  async fetchProjectTaskById(
    accountNumber: string,
    projectTaskId: string
  ) {
    const { CaseProjectTask } = await this.getModels(accountNumber);

    const projectTaskData = await CaseProjectTask.findOne({
      where: {
        rid: projectTaskId,
      },
    });

    return projectTaskData;
  }


  async fetchProjectTaskTypes() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const query = rawQueries.fetchProjecTaskType();
    const result: any[] = await this.mainDbSequelize.query(
      query,
      {
        type: "SELECT"
      }
    );

    return result;
  }

  async fetchProjectTaskClassification() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await this.getMainSequelize();
    }

    const query = rawQueries.fetchProjetClassificationQuery();
    const result: any[] = await this.mainDbSequelize.query(
      query,
      {
        type: "SELECT"
      }
    );

    return result;
  }

  async getAllowedExportFields(
    userId: string,
    permission_name: string
  ): Promise<any[]> {
    const mainDbSequelize = await this.getMainSequelize();

    const userInfoResult = await mainDbSequelize.query(
      rawQueries.fetchProfileFromUser(),
      {
        replacements: { userId },
        type: "SELECT",
      }
    ) as any[];

    const [userInfo] = userInfoResult as [{ profile_rid: string }] | [];

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
          type: "SELECT",
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

  async fetchAccountById(accountId: string) {
    try {
      const mainDbSequelize = await this.getMainSequelize();
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
      const mainDbSequelize = await this.getMainSequelize();

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

  async fetchParentAccount(parentAccountId: string): Promise<string> {
    try {
      const sequelize = await this.getMainSequelize();

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

  async validateResourceByCode(
    accountNumber: string,
    resourceCode: string,
    accountId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await this.getSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);
      const resource = await Resource.findOne({
        where: {
          resource_code: resourceCode,
          account_rid: accountId,
        },
      });

      return resource;
    } catch (err) {
      throw new Error(
        "Error validating resource by code: " + (err as Error).message
      );
    }
  }

  async validateResourceById(
    accountNumber: string,
    resourceId: string,
    accountId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await this.getSequelize();

      const Resource = Resources.initialize(sequelize, schemaName);
      const resource = await Resource.findOne({
        where: {
          rid: resourceId,
          account_rid: accountId,
        },
      });

      return resource;
    } catch (err) {
      throw new Error(
        "Error validating resource by ID: " + (err as Error).message
      );
    }
  }

  async validateProjectFiscalById(
    accountNumber: string,
    projectFiscalId: string
  ) {
    try {
      const schemaName = `${SCHEMANAME_PREFIX}${accountNumber.replace(/\D/g, "")}`;
      const sequelize = await this.getSequelize();

      const ProjectFiscalModel = ProjectFiscal.initialize(sequelize, schemaName);
      const projectFiscal = await ProjectFiscalModel.findOne({
        where: {
          rid: projectFiscalId,
        },
      });

      return projectFiscal;
    } catch (err) {
      throw new Error(
        "Error validating project fiscal by ID: " + (err as Error).message
      );
    }
  }

  async getResourceStatuses(): Promise<Map<string, string> | null> {
    try {
      const mainDbSequelize = await this.getMainSequelize();
      const resourceStatus = rawQueries.fetchAllResourceStatus();
      const results = await mainDbSequelize.query(resourceStatus, {
        type: "SELECT",
      });

      if (!results || !Array.isArray(results)) {
        return null;
      }

      // Create lookup maps
      const statusMap = new Map(
        results.map((st: any) => [st.resource_status_name, st.rid])
      );

      return statusMap;
    } catch (error) {
      errorLog(`Failed to fetch resource statuses: ${(error as Error).message}`);
      return null;
    }
  }
}