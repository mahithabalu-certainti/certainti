import { Op, Order, Sequelize } from "sequelize";
import {
  HttpStatus,
  rawQueries,
} from "../../utils/constants";
import {
  ICreateProjectResource,
  IUpdateInlineProjectResource,
  IUpdateProjectResource,
} from "../../utils/types";
import { ProjectResourceSchemaService } from "./schemaService";
import { ProjectResourceMapper } from "../../utils/projectMapper";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import ProjectIngestionService from "../projectIngestionService";
import { Logger } from "winston";

export class ProjectResourceService {
  private projectResourceSchema: ProjectResourceSchemaService;
  private projectIngestion: ProjectIngestionService;
  private logger: Logger;


  constructor(logger: Logger) {
    this.logger=logger;
    this.projectResourceSchema = new ProjectResourceSchemaService();
    this.projectIngestion = new ProjectIngestionService(this.logger);
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
      const { account_rid, project_fiscal_rid, resource_code, start_date, end_date } =
        projectResourceData;
      const { accountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!accountNumber) {
        throw new Error("Invalid account ID");
      }

      const resourceData =
        await this.projectResourceSchema.validateResourceByCode(
          accountNumber,
          resource_code,
          account_rid
        );

      if (!resourceData) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      const projectFiscalData = await this.projectResourceSchema.validateProjectFiscalById(
        accountNumber,
        project_fiscal_rid
      );


      await this.projectResourceSchema.createProjectResourcesTable(
        accountNumber
      );

      if (projectFiscalData) {
        const existsInProjectResource =
          await this.projectResourceSchema.existsInProjectResourceTable(
            accountNumber,
            account_rid,
            projectFiscalData,
            resourceData,
            projectFiscalData.fiscal_year,
            projectFiscalData.project_code,
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

          // if (!existsInResourceTable) {
          //   await this.projectResourceSchema.insertIntoResourceTable(
          //     accountNumber,
          //     account_rid,
          //     userId,
          //     projectResourceData,
          //     transaction
          //   );
          // }

          const existsInResourceFiscal =
            await this.projectResourceSchema.existsInResourceFiscalTable(
              accountNumber,
              account_rid,
              resource_code,
              projectFiscalData.fiscal_year,
              transaction
            );

          if (!existsInResourceFiscal) {
            await this.projectResourceSchema.insertIntoResourceFiscalTable(
              accountNumber,
              account_rid,
              userId,
              projectResourceData,
              projectFiscalData.fiscal_year,
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
                projectFiscalData.fiscal_year,
                transaction
              );

            if (!existsInResourceFiscalRegion) {
              await this.projectResourceSchema.insertIntoResourceFiscalRegionTable(
                accountNumber,
                account_rid,
                userId,
                projectResourceData,
                projectFiscalData.fiscal_year,
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
                projectResourceData.project_fiscal_rid,
                projectFiscalData.fiscal_year,
                projectResourceData.region_rid,
                transaction
              );

            if (!existsInProjectFiscalRegion) {
              await this.projectResourceSchema.insertProjectFiscalRegionTable(
                accountNumber,
                projectFiscalData.project_code,
                projectResourceData,
                resourceData,
                projectFiscalData.fiscal_year,
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
                projectFiscalData.fiscal_year,
                projectResourceData.region_rid,
                transaction
              );
            if (!exisitInAccountFiscalRegion) {
              await this.projectResourceSchema.insertIntoAccountFiscalRegion(
                accountNumber,
                projectResourceData,
                resourceData,
                projectFiscalData.fiscal_year,
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
              projectFiscalData.project_code,
              projectResourceData,
              projectFiscalData.project_rid,
              projectFiscalData.fiscal_year,
              userId,
              transaction
            );

          const existsInProjectResourceFiscal =
            await this.projectResourceSchema.existsInProjectResourceFiscalTable(
              accountNumber,
              account_rid,
              projectFiscalData.fiscal_year,
              projectResourceData.project_fiscal_rid,
              resourceData.rid || "",
              projectResourceData.country_rid,
              transaction
            );
          if (!existsInProjectResourceFiscal) {
            await this.projectResourceSchema.insertIntoProjectResourceFiscalTable(
              accountNumber,
              projectResourceData,
              projectFiscalData,
              userId,
              projectResource,
              transaction
            );
          } else {
            await this.projectResourceSchema.updateProjectResourceFiscalTable(
              accountNumber,
              projectResourceData,
              projectFiscalData,
              projectFiscalData.fiscal_year,
              projectFiscalData.rid,
              resourceData.rid || "",
              userId,
              transaction
            );
          }

          if (projectResourceData.region_rid) {
            const existsInProjectResourceFiscalRegion =
              await this.projectResourceSchema.existsInProjectResourceFiscalRegionTable(
                accountNumber,
                account_rid,
                projectFiscalData.fiscal_year,
                projectFiscalData.rid,
                resourceData.rid || "",
                projectResourceData.country_rid || null,
                projectResourceData.region_rid,
                transaction
              );

            if (!existsInProjectResourceFiscalRegion) {
              await this.projectResourceSchema.insertIntoProjectResourceFiscalRegionTable(
                accountNumber,
                projectResourceData,
                projectFiscalData.project_rid,
                projectFiscalData.project_code,
                projectFiscalData.fiscal_year,
                userId,
                projectResource,
                transaction
              );
            } else {
              await this.projectResourceSchema.updateProjectResourceFiscalRegionTable(
                accountNumber,
                projectResourceData,
                projectFiscalData,
                projectFiscalData.fiscal_year,
                projectFiscalData.rid,
                resourceData.rid || "",
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
            projectResourceData.project_fiscal_rid,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectFiscalRegion(
            accountNumber,
            account_rid,
            projectFiscalData.project_code,
            projectFiscalData.rid,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectFiscalSummary(
            accountNumber,
            account_rid,
            projectFiscalData.rid,
            projectFiscalData.project_code,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesProject(
            accountNumber,
            account_rid,
            projectFiscalData.project_code,
            transaction
          );

          await this.projectResourceSchema.aggregatesProjectSummary(
            accountNumber,
            account_rid,
            projectFiscalData.project_code,
            transaction
          );

          await this.projectResourceSchema.aggregatesResourceFiscal(
            accountNumber,
            account_rid,
            projectResourceData.resource_code,
            resourceData,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesResourceFiscalRegion(
            accountNumber,
            account_rid,
            projectResourceData.resource_code,
            resourceData,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesAccountFiscal(
            accountNumber,
            account_rid,
            projectFiscalData.fiscal_year,
            transaction
          );

          await this.projectResourceSchema.aggregatesAccountFiscalRegion(
            accountNumber,
            account_rid,
            projectFiscalData.fiscal_year,
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
      const { account_rid, project_fiscal_rid } = projectResourceData;

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectData = await this.projectResourceSchema.validateProjectFiscalById(
        validAccountNumber,
        project_fiscal_rid
      );

      const resourceData =
        await this.projectResourceSchema.validateResourceByCode(
          validAccountNumber,
          projectResourceData.resource_code,
          account_rid
        );

      if (!resourceData) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid resource code: resource doesn't exists",
        };
      }

      const isDuplicate =
        await this.projectResourceSchema.validateProjectResource(
          validAccountNumber,
          projectResourceData,
          projectData.fiscal_year,
          projectData.project_code,          
          resourceData
        );

      if (isDuplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Same Resource details already exist for the project in the account for the fiscal year",
        };
      }

      const existingProjectResource =
        await this.projectResourceSchema.fetchExistingProjectResource(
          validAccountNumber,
          projectResourceData.project_resource_rid,
          transaction
        );

      const updateProjectResource =
        await this.projectResourceSchema.updateProjectResourceRecords(
          validAccountNumber,
          projectResourceData,
          userId,
          resourceData.rid || "",
          projectData,
          transaction
        );

      // project resources
      await this.updateFiscalTables(
        validAccountNumber,
        projectResourceData,
        projectData,
        userId,
        existingProjectResource,
        resourceData,
        transaction
      );

      // resources fiscal and region
      await this.updateResourceFiscalRegion(
        validAccountNumber,
        account_rid,
        projectResourceData,
        resourceData,
        userId,
        existingProjectResource,
        projectData.fiscal_year,
        transaction
      );

      // project fiscal region
      await this.updateProjectFiscalRegion(
        validAccountNumber,
        projectResourceData,
        projectData,
        resourceData,
        userId,
        transaction
      );

      // account fiscal region
      await this.updateAccountFiscalRegion(
        validAccountNumber,
        projectResourceData,
        existingProjectResource,
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
        resourceData,
        transaction
      );

      // projects
      await this.aggregateProject(
        validAccountNumber,
        account_rid,
        projectResourceData,
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
    data?: { projectResources: any; count: number };
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

      let { data: projectResources, count } =
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
        projectResources = projectResources.slice(offset, page * limit)
       
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResources,
          count,
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
    sortOrder: string,
    userId: string
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
          sortOrder,
          userId
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
    data?: { projectResource: any; attachment: any };
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
      const attachments =
        await this.projectResourceSchema.fetchAttachmentsByProjectResourceId(
          projectResourceId
        );
      let mappedAttachments = [];
      if (attachments.length > 0) {
        const sequelize = await initMainDbSequelize();
        // Get all IDs from attachments
        const documentTypeIds = attachments.map(
          (attachment) => attachment.document_type_rid
        );
        const documentCategoryIds = attachments.map(
          (attachment) => attachment.document_category_rid
        );
        const userIds = attachments.map((attachment) => attachment.created_by);
        
        // Execute all queries in parallel
        const [documentTypes, documentCategories, users] =
          await Promise.all([
            documentTypeIds.length > 0
              ? sequelize.query(rawQueries.GET_DOCUMENT_TYPES, {
                  replacements: { documentTypeIds },
                  type: "SELECT",
                })
              : [],
            documentCategoryIds.length > 0
              ? sequelize.query(rawQueries.GET_DOCUMENT_CATEGORIES, {
                  replacements: { documentCategoryIds },
                  type: "SELECT",
                })
              : [],
            userIds.length > 0
              ? sequelize.query(rawQueries.GET_USERS, {
                  replacements: { userIds },
                  type: "SELECT",
                })
              : []
          ]);
          
        // Enhance attachments with related data
        mappedAttachments = attachments.map((attachment) => {
          const documentType = documentTypes.find(
            (dt: any) => dt.rid === attachment.document_type_rid
          );
          const documentCategory = documentCategories.find(
            (dc: any) => dc.rid === attachment.document_category_rid
          );
          const uploadedBy = users.find(
            (u: any) => u.rid === attachment.created_by
          );
          const attachedTo = projectResource?.r_number;

          return {
            ...attachment,
            document_type: (documentType as any)?.type_name || "",
            document_category: (documentCategory as any)?.category_name || "",
            uploaded_by: (uploadedBy as any)?.full_name || "",
            attached_to: attachedTo,
            size_in_mb: attachment.size_in_mb
            ? `${attachment.size_in_mb} mb`
            : "0 mb",
          };
        });
      }
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          projectResource,
          attachment: mappedAttachments,
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
        project_fiscal_rid,
        project_resource_rid,
        total_cost_pro_res,
        total_hours_pro_res,
        region_rid,
      } = projectResourceData;

      const { accountNumber: validAccountNumber } =
        await this.projectResourceSchema.fetchValidAccountNumberById(
          account_rid
        );

      if (!validAccountNumber) {
        throw new Error("Invalid account ID");
      }

      const projectData = await this.projectResourceSchema.validateProjectFiscalById(
        validAccountNumber,
        project_fiscal_rid
      );

      let resourceData = null;

      const existingProjectResource =
        await this.projectResourceSchema.fetchExistingProjectResource(
          validAccountNumber,
          projectResourceData.project_resource_rid,
          transaction
        );

      if(!existingProjectResource){
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid project resource ID: project resource doesn't exists",
        };
      }

      resourceData =
        await this.projectResourceSchema.validateResourceById(
          validAccountNumber,
          existingProjectResource?.resource_rid,
          account_rid
        );

        if(projectResourceData.resource_code){
          resourceData = await this.projectResourceSchema.validateResourceByCode(
            validAccountNumber,
            projectResourceData.resource_code,
            projectResourceData.account_rid
          );
        }

        if (!resourceData) {
          return {
            statusCode: HttpStatus.FAILED,
            message: HttpStatus.FAILED_MESSAGE,
            errorMessage: "Invalid resource code: resource doesn't exists",
          };
        }

      const isDuplicate =
        await this.projectResourceSchema.validateProjectResourceInlineEdit(
          validAccountNumber,
          projectResourceData,
          projectData.fiscal_year,
          projectData.project_code,
          existingProjectResource,
          resourceData
        );

      if (isDuplicate) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Same Resource details already exist for the project in the account for the fiscal year",
        };
      }

      const updateProjectResource =
        await this.projectResourceSchema.updateInlineProjectResourceRecords(
          validAccountNumber,
          projectResourceData,
          userId,
          projectData,
          resourceData,
          transaction
        );

      if (
        updateProjectResource &&
        (total_cost_pro_res || total_hours_pro_res || region_rid)
      ) {
        const resourceUpdatePayload =
          ProjectResourceMapper.mapToProjectResourceUpload(
            updateProjectResource,
            userId,
            resourceData
          );

        // project resources
        await this.updateFiscalTables(
          validAccountNumber,
          resourceUpdatePayload,
          projectData,
          userId,
          existingProjectResource,
          resourceData,
          transaction
        );

        // resources fiscal region
        await this.updateResourceFiscalRegion(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
          resourceData,
          userId,
          existingProjectResource,
          projectData.fiscal_year,
          transaction
        );

        // project fiscal region
        await this.updateProjectFiscalRegion(
          validAccountNumber,
          resourceUpdatePayload,
          projectData,
          resourceData,
          userId,
          transaction
        );

        // account fiscal region
        await this.updateAccountFiscalRegion(
          validAccountNumber,
          resourceUpdatePayload,
          existingProjectResource,
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
          resourceData,
          transaction
        );

        // projects
        await this.aggregateProject(
          validAccountNumber,
          account_rid,
          resourceUpdatePayload,
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
          project_resource_rid
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

  async getResourceCodes(accountId: string, search: string | null): Promise<{
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
        accountId,
        search
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

  async getAssignedResourceCodes(accountId: string, projectFiscalId: string): Promise<{
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
      const resourceCodes = await this.projectResourceSchema.listAssignedResourceCodes(
        accountNumber,
        accountId,
        projectFiscalId
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
    projectResourceData: any,
    projectData: any,
    userId: string,
    existingProjectResource: any,
    resourceData: any,
    transaction: any
  ) {
    await this.projectResourceSchema.updateProjectResourceFiscalOnUpdateTable(
      accountNumber,
      projectResourceData,
      projectData.project_rid,
      projectData.fiscal_year,
      userId,
      resourceData,
      existingProjectResource,
      transaction
    );

    await this.projectResourceSchema.updateProjectResourceFiscalRegionTableOnUpdate(
      accountNumber,
      projectResourceData,
      projectData.project_rid,
      projectData.fiscal_year,
      projectData.project_code,
      resourceData,
      userId,
      existingProjectResource,
      transaction
    );
  }

  private async updateResourceFiscalRegion(
    accountNumber: string,
    accountId: string,
    projectResourceData: any,
    resourceData: any,
    userId: string,
    existingProjectResource: any,
    fiscalYear: number,
    transaction: any
  ) {
    await this.projectResourceSchema.updateResourceFiscal(
      accountNumber,
      accountId,
      userId,
      projectResourceData,
      resourceData,
      fiscalYear,
      transaction,
      existingProjectResource
    );

    // if (projectResourceData.region_rid) {
    // const existsInResourceFiscalRegion =
    //   await this.projectResourceSchema.existsInResourceFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectResourceData.resource_code,
    //     projectResourceData.region_rid,
    //     transaction
    //   );

    // if (!existsInResourceFiscalRegion) {

    // }
    await this.projectResourceSchema.insertIntoResourceFiscalRegionTableOnUpdate(
      accountNumber,
      accountId,
      userId,
      projectResourceData,
      resourceData,
      fiscalYear,
      transaction,
      existingProjectResource
    );
    // }
  }

  private async updateProjectFiscalRegion(
    accountNumber: string,
    projectResourceData: any,
    projectData: any,
    resourceData: any,
    userId: string,
    transaction: any
  ) {
    // if (projectResourceData.region_rid) {
    // const existsInProjectFiscalRegion =
    //   await this.projectResourceSchema.existsInProjectFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectData.project_code,
    //     projectData.fiscal_year,
    //     projectResourceData.region_rid,
    //     transaction
    //   );

    // if (!existsInProjectFiscalRegion) {
    await this.projectResourceSchema.insertProjectFiscalRegionTableOnUpdate(
      accountNumber,
      projectData.project_code,
      projectData.project_rid,
      projectResourceData,
      resourceData,
      projectData.fiscal_year,
      userId,
      transaction
    );

    await this.projectResourceSchema.cleanupOrphanedProjectFiscalRegions(
      accountNumber,
      projectResourceData.account_rid,
      projectResourceData.project_fiscal_rid,
      projectData.project_code,
      projectData.fiscal_year,
      transaction
    );
    // }
    // }
  }

  private async updateAccountFiscalRegion(
    accountNumber: string,
    projectResourceData: any,
    existingProjectResource: any,
    projectData: any,
    userId: string,
    transaction: any
  ) {
    // if (projectResourceData.region_rid) {
    // const exisitInAccountFiscalRegion =
    //   await this.projectResourceSchema.existsInAccountFiscalRegionTable(
    //     accountNumber,
    //     accountId,
    //     projectData.fiscal_year,
    //     projectResourceData.region_rid,
    //     transaction
    //   );
    // if (!exisitInAccountFiscalRegion) {
    await this.projectResourceSchema.insertIntoAccountFiscalRegionOnUpdate(
      accountNumber,
      projectResourceData,
      projectData.fiscal_year,
      projectResourceData.region_rid || "",
      existingProjectResource.region_rid || "",
      userId,
      transaction
    );

    // await this.projectResourceSchema.cleanupOrphanedAccountFiscalRegion(
    //   accountNumber,
    //   projectResourceData.account_rid,
    //   projectData.fiscal_year,
    //   existingProjectResource.region_rid || "",
    //   transaction
    // );
    // }
    // }
  }

  private async aggregateResource(
    accountNumber: string,
    account_rid: string,
    projectResourceData: any,
    projectData: any,
    resourceData: any,
    transaction: any
  ) {
    const { resource_code, region_rid } = projectResourceData;
    const { fiscal_year } = projectData;

    await this.projectResourceSchema.aggregatesResourceFiscal(
      accountNumber,
      account_rid,
      resource_code,
      resourceData,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesResourceFiscalRegion(
      accountNumber,
      account_rid,
      resource_code,
      resourceData,
      fiscal_year,
      transaction
    );
  }

  private async aggregateProject(
    accountNumber: string,
    account_rid: string,
    projectResourceData: any,
    projectData: any,
    transaction: any
  ) {
    const { project_code, fiscal_year, rid } = projectData;

    await this.projectResourceSchema.aggregatesProjectFiscal(
      accountNumber,
      account_rid,
      projectResourceData.project_fiscal_rid,
      fiscal_year,
      transaction
    );
    await this.projectResourceSchema.aggregatesProjectFiscalRegion(
      accountNumber,
      account_rid,
      project_code,
      rid,
      fiscal_year,
      transaction
    );
    // await this.projectResourceSchema.aggregatesProject(
    //   accountNumber,
    //   account_rid,
    //   project_code,
    //   transaction
    // );
    await this.projectResourceSchema.aggregatesProjectFiscalSummary(
      accountNumber,
      account_rid,
      rid,
      project_code,
      fiscal_year,
      transaction
    );
    // await this.projectResourceSchema.aggregatesProjectSummary(
    //   accountNumber,
    //   account_rid,
    //   project_code,
    //   transaction
    // );
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
    // await this.projectResourceSchema.aggregatesAccount(
    //   accountNumber,
    //   account_rid,
    //   transaction
    // );
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
      "fiscal_year",
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

    const enumFields = [
      "country_rid",
      "region_rid",
    ];

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
      { clientField: "region_rid", dbField: "region_rid" },
      { clientField: "country_rid", dbField: "country_rid" },
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
        const value = String(fieldFilter.equals).includes('.') ? fieldFilter.equals : `${fieldFilter.equals}.00`;
        return { [Op.eq]: value };
      }
      if (fieldFilter.not_equals !== undefined) {
        const value = String(fieldFilter.not_equals).includes('.') ? fieldFilter.not_equals : `${fieldFilter.not_equals}.00`;
        return {
          [Op.or]: [{ [Op.ne]: value }, { [Op.is]: null }],
        };
      }
      if (fieldFilter.less_than !== undefined) {
        const value = String(fieldFilter.less_than).includes('.') ? fieldFilter.less_than : `${fieldFilter.less_than}.00`;
        return { [Op.lt]: value };
      }
      if (fieldFilter.greater_than !== undefined) {
        const value = String(fieldFilter.greater_than).includes('.') ? fieldFilter.greater_than : `${fieldFilter.greater_than}.00`;
        return { [Op.gt]: value };
      }
      if (
        fieldFilter.between &&
        Array.isArray(fieldFilter.between) &&
        fieldFilter.between.length === 2
      ) {
        const value1 = String(fieldFilter.between[0]).includes('.') ? fieldFilter.between[0] : `${fieldFilter.between[0]}.00`;
        const value2 = String(fieldFilter.between[1]).includes('.') ? fieldFilter.between[1] : `${fieldFilter.between[1]}.00`;
        return {
          [Op.between]: [value1, value2],
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
