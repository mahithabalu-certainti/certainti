import { Op, Order, Sequelize } from "sequelize";
import { HttpStatus } from "../../utils/constants";
import {
  ICreateProjectResource,
  IUpdateInlineProjectResource,
  IUpdateProjectResource,
} from "../../utils/types";
import { ProjectResourceSchemaService } from "./schemaService";
import constants from "constants";
import { ProjectResourceMapper } from "../../utils/projectMapper";

export class ProjectResourceService {
  private projectResourceSchema: ProjectResourceSchemaService;

  constructor() {
    this.projectResourceSchema = new ProjectResourceSchemaService();
  }

  async createProjectResource(
    projectResourceData: ICreateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { account_rid, project_rid, resource_code, start_date, end_date } =
        projectResourceData;
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const isResourceExist =
        await this.projectResourceSchema.validateResourceByCode(
          accountNumber,
          resource_code,
          account_rid
        );

      if (!isResourceExist) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      const projectData = await this.projectResourceSchema.validateProjectById(
        accountNumber,
        project_rid
      );

      await this.projectResourceSchema.createProjectResourcesTable(
        accountNumber
      );

      if (projectData) {
        const existsInProjectResource =
          await this.projectResourceSchema.existsInProjectResourceTable(
            accountNumber,
            account_rid,
            projectData.fiscal_year,
            projectData.project_code,
            resource_code,
            start_date,
            end_date
          );

        if (!existsInProjectResource) {
          const existsInResourceTable =
            await this.projectResourceSchema.existsInResourceTable(
              accountNumber,
              account_rid,
              resource_code,
              transaction
            );

          if (!existsInResourceTable) {
            await this.projectResourceSchema.insertIntoResourceTable(
              accountNumber,
              account_rid,
              userId,
              projectResourceData,
              transaction
            );
          }

          const existsInResourceFiscal =
            await this.projectResourceSchema.existsInResourceFiscalTable(
              accountNumber,
              account_rid,
              resource_code,
              projectData.fiscal_year,
              transaction
            );

          if (!existsInResourceFiscal) {
            await this.projectResourceSchema.insertIntoResourceFiscalTable(
              accountNumber,
              account_rid,
              userId,
              projectResourceData,
              projectData.fiscal_year,
              transaction
            );
          }

          if (projectResourceData.region_rid) {
            const existsInResourceFiscalRegion =
              await this.projectResourceSchema.existsInResourceFiscalRegionTable(
                accountNumber,
                account_rid,
                resource_code,
                projectResourceData.region_rid,
                transaction
              );

            if (!existsInResourceFiscalRegion) {
              await this.projectResourceSchema.insertIntoResourceFiscalRegionTable(
                accountNumber,
                account_rid,
                userId,
                projectResourceData,
                projectData.fiscal_year,
                transaction
              );
            }
          }
          // else {
          //   await this.projectResourceSchema.updateResourceFiscalTable(
          //     accountNumber,
          //     account_rid,
          //     userId,
          //     projectResourceData,
          //     transaction
          //   );
          // }

          // project
          // const existsInProjectFiscal =
          //   await this.projectResourceSchema.existsInProjectFiscalTable(
          //     accountNumber,
          //     account_rid,
          //     projectData.project_code,
          //     fiscal_year,
          //     transaction
          //   );
          // if (!existsInProjectFiscal) {
          //   const createdProjectFiscal = await this.projectResourceSchema.insertProjectFiscalTable(
          //     accountNumber,
          //     account_rid,
          //     projectData.project_code,
          //     fiscal_year,
          //     projectResourceData,
          //     userId,
          //     transaction
          //   );

          //   await this.projectResourceSchema.insertProjectFiscalSummaryTable(
          //     accountNumber,
          //     account_rid,
          //     projectData.project_code,
          //     fiscal_year,
          //     projectResourceData,
          //     userId,
          //     createdProjectFiscal,
          //     transaction
          //   );
          // }

          if (projectResourceData.region_rid) {
            const existsInProjectFiscalRegion =
              await this.projectResourceSchema.existsInProjectFiscalRegionTable(
                accountNumber,
                account_rid,
                projectData.project_code,
                projectData.fiscal_year,
                projectResourceData.region_rid,
                transaction
              );

            if (!existsInProjectFiscalRegion) {
              await this.projectResourceSchema.insertProjectFiscalRegionTable(
                accountNumber,
                projectData.project_code,
                projectResourceData,
                projectData.fiscal_year,
                userId,
                transaction
              );
            }
          }

          // account fiscal
          // const exisitInAccountFiscal = await this.projectResourceSchema.existsInAccountFiscalTable(
          //   accountNumber,
          //   account_rid,
          //   fiscal_year,
          //   transaction
          // );
          // if(!exisitInAccountFiscal){
          //   await this.projectResourceSchema.insertIntoAccountFiscal(
          //     accountNumber,
          //     projectResourceData,
          //     userId,
          //     transaction
          //   );
          // };

          if (projectResourceData.region_rid) {
            const exisitInAccountFiscalRegion =
              await this.projectResourceSchema.existsInAccountFiscalRegionTable(
                accountNumber,
                account_rid,
                projectData.fiscal_year,
                projectResourceData.region_rid,
                transaction
              );
            if (!exisitInAccountFiscalRegion) {
              await this.projectResourceSchema.insertIntoAccountFiscalRegion(
                accountNumber,
                projectResourceData,
                projectData.fiscal_year,
                projectResourceData.region_rid,
                userId,
                transaction
              );
            }
          }

          // project resource
          const projectResource =
            await this.projectResourceSchema.insertIntoProjectResourceTable(
              accountNumber,
              projectData.project_code,
              projectResourceData,
              projectData.fiscal_year,
              userId,
              transaction
            );

          const existsInProjectResourceFiscal =
            await this.projectResourceSchema.existsInProjectResourceFiscalTable(
              accountNumber,
              account_rid,
              projectData.fiscal_year,
              projectData.project_code,
              projectResourceData.country_rid,
              resource_code,
              transaction
            );
          if (!existsInProjectResourceFiscal) {
            await this.projectResourceSchema.insertIntoProjectResourceFiscalTable(
              accountNumber,
              projectResourceData,
              projectData,
              userId,
              projectResource,
              transaction
            );
          } else {
            await this.projectResourceSchema.updateProjectResourceFiscalTable(
              accountNumber,
              projectResourceData,
              projectData.fiscal_year,
              projectData.project_code,
              userId,
              transaction
            );
          }

          if (projectResourceData.region_rid) {
            const existsInProjectResourceFiscalRegion =
              await this.projectResourceSchema.existsInProjectResourceFiscalRegionTable(
                accountNumber,
                account_rid,
                projectData.fiscal_year,
                projectData.project_code,
                resource_code,
                projectResourceData.country_rid || null,
                projectResourceData.region_rid,
                transaction
              );

            if (!existsInProjectResourceFiscalRegion) {
              await this.projectResourceSchema.insertIntoProjectResourceFiscalRegionTable(
                accountNumber,
                projectResourceData,
                projectData.project_code,
                projectData.fiscal_year,
                userId,
                projectResource,
                transaction
              );
            } else {
              await this.projectResourceSchema.updateProjectResourceFiscalRegionTable(
                accountNumber,
                projectResourceData,
                projectData.fiscal_year,
                projectData.project_code,
                userId,
                transaction
              );
            }
          }

          if (projectResource) {
            await this.projectResourceSchema.addProjectResourceTimeline(
              accountNumber,
              "create",
              projectResourceData,
              projectResource.rid,
              userId,
              transaction
            );
          }

          await this.projectResourceSchema.aggregatesProjectFiscal(
            accountNumber,
            account_rid,
            projectData.project_code,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectFiscalRegion(
            accountNumber,
            account_rid,
            projectData.project_code,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectFiscalSummary(
            accountNumber,
            account_rid,
            projectData.project_code,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProject(
            accountNumber,
            account_rid,
            projectData.project_code,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectSummary(
            accountNumber,
            account_rid,
            projectData.project_code,
            transaction
          );

          await this.projectResourceSchema.aggregatesResourceFiscal(
            accountNumber,
            account_rid,
            projectResourceData.resource_code,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesResourceFiscalRegion(
            accountNumber,
            account_rid,
            projectResourceData.resource_code,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesAccountFiscal(
            accountNumber,
            account_rid,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesAccountFiscalRegion(
            accountNumber,
            account_rid,
            projectData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesAccount(
            accountNumber,
            account_rid,
            transaction
          );

          await transaction.commit();
        } else {
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage:
              "Same Resource details already exist for the project in the account for the fiscal year",
          };
        }
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource: projectResourceData,
        },
      };
    } catch (err) {
      await transaction.rollback();
      console.log("Error creatng resource", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async updateProjectResource(
    projectResourceData: IUpdateProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any };
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const { account_rid, project_rid } = projectResourceData;

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectData = await this.projectResourceSchema.validateProjectById(
        validAccountNumber,
        project_rid
      );

      const updateProjectResource =
        await this.projectResourceSchema.updateProjectResourceRecords(
          validAccountNumber,
          projectResourceData,
          userId,
          projectData,
          transaction
        );

      // project resources
      await this.updateFiscalTables(
        validAccountNumber,
        projectResourceData,
        projectData,
        userId,
        transaction
      );

      // resources fiscal region
      await this.updateResourceFiscalRegion(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        userId,
        transaction
      );

      // project fiscal region
      await this.updateProjectFiscalRegion(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        userId,
        transaction
      );

      // account fiscal region
      await this.updateAccountFiscalRegion(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        userId,
        transaction
      );

      // resources
      await this.aggregateResource(
        validAccountNumber,
        account_rid,
        projectResourceData,
        projectData,
        transaction
      );

      // projects
      await this.aggregateProject(
        validAccountNumber,
        account_rid,
        projectData,
        transaction
      );

      // accounts
      await this.aggregateAccount(
        validAccountNumber,
        account_rid,
        projectData.fiscal_year,
        transaction
      );

      await this.recordTimelineAndHistory(
        validAccountNumber,
        projectResourceData,
        projectResourceData,
        userId,
        transaction
      );

      await transaction.commit();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource: updateProjectResource,
        },
      };
    } catch (err) {
      console.log("Error updating project resource", err);
      await transaction.rollback();
      throw this.throwServiceError(err as Error);
    }
  }

  async listProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    page: number,
    limit: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any, count: number };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const offset = (page - 1) * limit;

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters);

      const { data: projectResources, count } =
        await this.projectResourceSchema.listProjectResourceSchema(
          accountNumber,
          accountId,
          projectId,
          filters,
          whereClause,
          fiscal_year,
          offset,
          limit,
          order,
          sortBy,
          sortOrder
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
          count
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async exportProjectResources(
    accountId: string,
    projectId: string,
    fiscal_year: number,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResources: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      // construct sorting
      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );
      const order: Order = [[finalSortBy, finalSortOrder]];

      // construct filters
      const { whereClause } = this.buildWhereClause(filters);

      const projectResources =
        await this.projectResourceSchema.exportProjectResourceSchema(
          accountNumber,
          accountId,
          projectId,
          filters,
          whereClause,
          fiscal_year,
          order,
          sortBy,
          sortOrder
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async projectResourceDetails(
    projectResourceId: string,
    accountId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { projectResource: any, attachment: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectResource =
        await this.projectResourceSchema.fetchProjectResourceDetails(
          accountNumber,
          projectResourceId
        );

      // Fetch attachments for the project resource
        const attachments = await this.projectResourceSchema.fetchAttachmentsByProjectResourceId(
          projectResourceId
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource,
          attachment: attachments || []
        },
      };
    } catch (err) {
      console.log("Error fetching project ressouce", err);
      throw this.throwServiceError(err as Error);
    }
  }

  async inLineEditProjectResource(
    projectResourceData: IUpdateInlineProjectResource,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    const dbInit = await this.projectResourceSchema.getSequelize();
    const transaction = await dbInit.transaction();
    try {
      const {
        account_rid,
        project_rid,
        project_resource_rid,
        total_cost_pro_res,
        total_hours_pro_res,
      } = projectResourceData;

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectData = await this.projectResourceSchema.validateProjectById(
        validAccountNumber,
        project_rid
      );

      const updateProjectResource = await this.projectResourceSchema.updateInlineProjectResourceRecords(
        validAccountNumber,
        projectResourceData,
        userId,
        projectData,
        transaction
      );

      if (updateProjectResource && total_cost_pro_res && total_hours_pro_res) {
        const resourceUpdatePayload =
          ProjectResourceMapper.mapToProjectResourceUpload(
            updateProjectResource,
            userId
          );

        // project resources
        await this.updateFiscalTables(
          validAccountNumber,
          resourceUpdatePayload,
          projectData,
          userId,
          transaction
        );

        // resources fiscal region
        await this.updateResourceFiscalRegion(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          userId,
          transaction
        );

        // project fiscal region
        await this.updateProjectFiscalRegion(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          userId,
          transaction
        );

        // account fiscal region
        await this.updateAccountFiscalRegion(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          userId,
          transaction
        );

        // resources
        await this.aggregateResource(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          projectData,
          transaction
        );

        // projects
        await this.aggregateProject(
          validAccountNumber,
          account_rid,
          projectData,
          transaction
        );

        // accounts
        await this.aggregateAccount(
          validAccountNumber,
          account_rid,
          projectData.fiscal_year,
          transaction
        );
      }

      await this.recordTimelineAndHistory(
        validAccountNumber,
        projectResourceData,
        projectResourceData,
        userId,
        transaction
      );

      await transaction.commit();

      const updateProjectResourceRecord =
        await this.projectResourceSchema.fetchProjectResourceDetails(
          validAccountNumber,
          project_resource_rid,
        );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: updateProjectResourceRecord,
      };
    } catch (err) {
      console.log("Error updating project resource", err);
      await transaction.rollback();
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceSkillRoles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRoles: any };
  }> {
    try {
      const resourceRoles =
        await this.projectResourceSchema.listResourceSkillRoles();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceRoles,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceSkillRolesSubtype(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceRolesSubType: any };
  }> {
    try {
      const resourceRolesSubType =
        await this.projectResourceSchema.listResourceSkillRolesSubType();

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceRolesSubType: resourceRolesSubType,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  async getResourceCodes(accountId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCodes: any };
  }> {
    try {
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(accountId);

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }
      const resourceCodes = await this.projectResourceSchema.listResourceCodes(
        accountNumber,
        accountId
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCodes,
        },
      };
    } catch (err) {
      throw this.throwServiceError(err as Error);
    }
  }

  private async updateFiscalTables(
    accountNumber: string,
    projectResourceData: IUpdateProjectResource,
    projectData: any,
    userId: string,
    transaction: any
  ) {
    await this.projectResourceSchema.updateProjectResourceFiscalTable(
      accountNumber,
      projectResourceData,
      projectData.fiscal_year,
      projectData.project_code,
      userId,
      transaction
    );

    await this.projectResourceSchema.updateProjectResourceFiscalRegionTable(
      accountNumber,
      projectResourceData,
      projectData.fiscal_year,
      projectData.project_code,
      userId,
      transaction
    );
  }

  private async updateResourceFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectResourceData: IUpdateProjectResource,
    projectData: any,
    userId: string,
    transaction: any
  ) {
    if (projectResourceData.region_rid) {
      const existsInResourceFiscalRegion =
        await this.projectResourceSchema.existsInResourceFiscalRegionTable(
          accountNumber,
          accountId,
          projectResourceData.resource_code,
          projectResourceData.region_rid,
          transaction
        );

      if (!existsInResourceFiscalRegion) {
        await this.projectResourceSchema.insertIntoResourceFiscalRegionTable(
          accountNumber,
          accountId,
          userId,
          projectResourceData,
          projectData.fiscal_year,
          transaction
        );
      }
    }
  }

  private async updateProjectFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectResourceData: IUpdateProjectResource,
    projectData: any,
    userId: string,
    transaction: any
  ) {
    if (projectResourceData.region_rid) {
      const existsInProjectFiscalRegion =
        await this.projectResourceSchema.existsInProjectFiscalRegionTable(
          accountNumber,
          accountId,
          projectData.project_code,
          projectData.fiscal_year,
          projectResourceData.region_rid,
          transaction
        );

      if (!existsInProjectFiscalRegion) {
        await this.projectResourceSchema.insertProjectFiscalRegionTable(
          accountNumber,
          projectData.project_code,
          projectResourceData,
          projectData.fiscal_year,
          userId,
          transaction
        );
      }
    }
  }

  private async updateAccountFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectResourceData: IUpdateProjectResource,
    projectData: any,
    userId: string,
    transaction: any
  ) {
    if (projectResourceData.region_rid) {
      const exisitInAccountFiscalRegion =
        await this.projectResourceSchema.existsInAccountFiscalRegionTable(
          accountNumber,
          accountId,
          projectData.fiscal_year,
          projectResourceData.region_rid,
          transaction
        );
      if (!exisitInAccountFiscalRegion) {
        await this.projectResourceSchema.insertIntoAccountFiscalRegion(
          accountNumber,
          projectResourceData,
          projectData.fiscal_year,
          projectResourceData.region_rid,
          userId,
          transaction
        );
      }
    }
  }

  private async aggregateResource(
    accountNumber: string,
    account_rid: string,
    projectResourceData: IUpdateProjectResource,
    projectData: any,
    transaction: any
  ) {
    const { resource_code } = projectResourceData;
    const { fiscal_year } = projectData;

    await this.projectResourceSchema.aggregatesResourceFiscal(
      accountNumber,
      account_rid,
      resource_code,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesResourceFiscalRegion(
      accountNumber,
      account_rid,
      resource_code,
      fiscal_year,
      transaction
    );
  }

  private async aggregateProject(
    accountNumber: string,
    account_rid: string,
    projectData: any,
    transaction: any
  ) {
    const { project_code, fiscal_year } = projectData;

    await this.projectResourceSchema.aggregatesProjectFiscal(
      accountNumber,
      account_rid,
      project_code,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesProjectFiscalRegion(
      accountNumber,
      account_rid,
      project_code,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesProject(
      accountNumber,
      account_rid,
      project_code,
      transaction
    );
    await this.projectResourceSchema.aggregatesProjectFiscalSummary(
      accountNumber,
      account_rid,
      project_code,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesProjectSummary(
      accountNumber,
      account_rid,
      project_code,
      transaction
    );
  }

  private async aggregateAccount(
    accountNumber: string,
    account_rid: string,
    fiscal_year: number,
    transaction: any
  ) {
    await this.projectResourceSchema.aggregatesAccountFiscal(
      accountNumber,
      account_rid,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesAccountFiscalRegion(
      accountNumber,
      account_rid,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesAccount(
      accountNumber,
      account_rid,
      transaction
    );
  }

  private async recordTimelineAndHistory(
    accountNumber: string,
    updatedProjectResource: any,
    projectResourceData: IUpdateProjectResource | IUpdateInlineProjectResource,
    userId: string,
    transaction: any
  ) {
    if (!updatedProjectResource) return;

    const existing =
      await this.projectResourceSchema.fetchExistingProjectResource(
        accountNumber,
        projectResourceData.project_resource_rid,
        transaction
      );

    await this.projectResourceSchema.updateProjectResourceTimeline(
      accountNumber,
      "update",
      projectResourceData,
      projectResourceData.project_resource_rid,
      userId,
      transaction
    );

    await this.projectResourceSchema.addProjectResourceHistory(
      accountNumber,
      updatedProjectResource,
      existing,
      projectResourceData.project_resource_rid,
      userId,
      transaction
    );
  }

  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "resource_code",
      "resource_name",
      "fiscal_year",
      "resource_role",
      "total_hours_pro_res",
      "total_cost_pro_res",
      "qre_percent",
      "qre_final",
      "description",
      "project_resource_code",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  buildWhereClause(filters: Record<string, any>): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};

    whereClause = this.applyFilters(filters, whereClause);

    return { whereClause };
  }

  private applyFilters(
    filters: Record<string, any>,
    whereClause: Record<string, any>
  ): Record<string, any> {
    const castToTextFields = [
      "rid",
      "project_startdate",
      "project_enddate",
      "total_effort",
      "total_cost",
      "fiscal_year",
    ];

    const numberFields = [
      "total_hours_pro_res",
      "total_cost_pro_res",
      "qre_percent",
      "qre_final",
    ];

    const enumFields = ["resource_code"];

    const filterFields = this.getFilterFields();

    filterFields.forEach(({ clientField, dbField }) => {
      if (filters[clientField]) {
        const fieldFilter = filters[clientField];
        const isNumber = numberFields.includes(dbField);
        const isEnum = enumFields.includes(dbField);
        const isTextCastNeeded =
          castToTextFields.includes(clientField) && !isNumber;

        if (isTextCastNeeded) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.cast(Sequelize.col(dbField), "TEXT"),
            this.getFieldFilter(fieldFilter, isNumber, isEnum)
          );
        } else {
          whereClause[dbField] = this.getFieldFilter(
            fieldFilter,
            isNumber,
            isEnum
          );
        }
      }
    });

    return whereClause;
  }

  getFilterFields(): { clientField: string; dbField: string }[] {
    const projectFilterFields = [
      { clientField: "resource_code", dbField: "resource_code" },
      { clientField: "resource_name", dbField: "resource_name" },
      // { clientField: "region_rid", dbField: "region_rid" },
      // { clientField: "resource_type", dbField: "resource_type" },
      { clientField: "resource_role", dbField: "resource_role" },
      { clientField: "total_hours_pro_res", dbField: "total_hours_pro_res" },
      { clientField: "total_cost_pro_res", dbField: "total_cost_pro_res" },
      { clientField: "qre_final", dbField: "qre_final" },
      { clientField: "qre_percent", dbField: "qre_percent" },
      { clientField: "description", dbField: "description" },
      {
        clientField: "project_resource_code",
        dbField: "project_resource_code",
      },
    ];

    return projectFilterFields;
  }

  private getFieldFilter(
    fieldFilter: any,
    isNumberField: boolean,
    isEnumField: boolean
  ): any {
    if (isNumberField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        return { [Op.lt]: fieldFilter.less_than };
      }
      if (fieldFilter.greater_than !== undefined) {
        return { [Op.gt]: fieldFilter.greater_than };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        return {
          [Op.between]: [fieldFilter.between[0], fieldFilter.between[1]],
        };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    if (isEnumField) {
      if (fieldFilter.equals !== undefined) {
        return { [Op.eq]: fieldFilter.equals };
      }
      if (fieldFilter.not_equals !== undefined) {
        return {
          [Op.or]: [{ [Op.ne]: fieldFilter.not_equals }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.in && Array.isArray(fieldFilter.in)) {
        return { [Op.in]: fieldFilter.in };
      }
      if (fieldFilter.is_empty === true) {
        return { [Op.or]: [null] };
      }
    }

    // String (default)
    if (fieldFilter.equals) {
      return { [Op.iLike]: fieldFilter.equals };
    }
    if (fieldFilter.not_equals) {
      return {
        [Op.or]: [{ [Op.notILike]: fieldFilter.not_equals }, { [Op.is]: null }],
      };
    }
    if (fieldFilter.contains) {
      return { [Op.iLike]: `%${fieldFilter.contains}%` };
    }
    if (fieldFilter.not_contains) {
      return {
        [Op.or]: [
          { [Op.notILike]: `%${fieldFilter.not_contains}%` },
          { [Op.is]: null },
        ],
      };
    }
    if (fieldFilter.is_empty === true) {
      return { [Op.or]: [null, ""] };
    }
    if (fieldFilter.value) {
      return fieldFilter.value;
    }

    return undefined;
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
