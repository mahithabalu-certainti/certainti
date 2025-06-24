import { ResourceCost } from "../models/resourceCost";
import { Resources } from "../models/resource";
import { IResourceCost, IUpdateResourceCost } from "../utils/types";
import { HttpStatus } from "../utils/constants";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";
import resourceCostSchemaService from "../services/resourceCostSchemaService";
import SchemaService from "./schemaService";
import { initOrgSequelize } from "../config/orgDataSource";
import { ResourceFiscal } from "../models/resourceFiscal";
import { initMainDbSequelize } from "../config/mainDataSource";
import { Op, Sequelize } from "sequelize";
import moment from "moment";
import Decimal from "decimal.js";

class ResourceCostService {
  private schemaService: SchemaService;
  private orgSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor() {
    this.schemaService = new SchemaService();
  }

  /**
   * Get the organization database connection
   */
  private async getOrgSequelize(): Promise<Sequelize> {
    if (!this.orgSequelize) {
      this.orgSequelize = await initOrgSequelize();
    }
    return this.orgSequelize;
  }

  /**
   * Get the main database connection
   */
  private async getMainDbSequelize(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  /**
   * Retrieves a paginated list of resource costs for a specific account and fiscal year.
   * Supports filtering, sorting, and searching functionality.
   *
   * @param page - Page number for pagination
   * @param limit - Number of records per page
   * @param search - Search term to filter results
   * @param filters - Object containing filter criteria
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @param accountNumber - Account identifier for schema selection
   * @param fiscalYear - Fiscal year to filter results
   * @returns Promise with status code and resource cost data or error message
   */
  async resourceCostList(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    resourceRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any; count: number };
  }> {
    try {
      const offset = (page - 1) * limit;
      const [finalSortBy, finalSortOrder] =
        resourceCostSchemaService.getSortParameters(sortBy, sortOrder);

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Check if account-specific schema exists
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableName = "resource_cost";
      const schemaAndTableValidation =
        await resourceCostSchemaService.validateSchema(
          accountNumberFetched,
          tableName
        );

      if (!schemaAndTableValidation) {
        return resourceCostSchemaService.createErrorResponse(
          "Account schema does not exist"
        );
      }
      const sequelize = await this.getOrgSequelize();
      if (!sequelize) {
        return resourceCostSchemaService.createErrorResponse(
          "Database connection not available"
        );
      }

      // Process currency filters if present
      if (filters && filters.currency !== undefined) {
        const currencyFilterResult =
          await resourceCostSchemaService.processCurrencyFilter(filters);
        if (currencyFilterResult) {
          return currencyFilterResult;
        }
      }

      // Build query components
      const searchCondition =
        resourceCostSchemaService.buildSearchCondition(search);
      let filterConditions = resourceCostSchemaService.buildFilterConditions(
        filters,
        fiscalYear
      );

      // Execute queries and return results
      return await resourceCostSchemaService.executeQueries(
        schemaName,
        filterConditions,
        searchCondition,
        finalSortBy,
        finalSortOrder,
        resourceRid,
        limit,
        offset,
        search,
        accountId
      );
    } catch (err) {
      console.log("Error ", err);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a  list of resource costs for a specific account and fiscal year for downloadind  as excel.
   * Supports filtering, sorting, and searching functionality.
   * @param search - Search term to filter results
   * @param filters - Object containing filter criteria
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @param accountNumber - Account identifier for schema selection
   * @param fiscalYear - Fiscal year to filter results
   * @returns Promise with status code and resource cost data or error message
   */
  async exportResourceCostList(
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number,
    resourceRid: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }> {
    try {
      const [finalSortBy, finalSortOrder] =
        resourceCostSchemaService.getSortParameters(sortBy, sortOrder);

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Check if account-specific schema exists
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableName = "resource_cost";
      const schemaAndTableValidation =
        await resourceCostSchemaService.validateSchema(
          accountNumberFetched,
          tableName
        );

      if (!schemaAndTableValidation) {
        return resourceCostSchemaService.createErrorResponse(
          "Account schema does not exist"
        );
      }
      const sequelize = await this.getOrgSequelize();
      if (!sequelize) {
        return resourceCostSchemaService.createErrorResponse(
          "Database connection not available"
        );
      }

      // Process currency filters if present
      if (filters && filters.currency) {
        const currencyFilterResult =
          await resourceCostSchemaService.processCurrencyFilter(filters);
        if (currencyFilterResult) {
          return currencyFilterResult;
        }
      }

      // Build query components
      const searchCondition =
        resourceCostSchemaService.buildSearchCondition(search);
      let filterConditions = resourceCostSchemaService.buildFilterConditions(
        filters,
        fiscalYear
      );

      // Execute queries and return results
      return await resourceCostSchemaService.exportresourceCostDetails(
        schemaName,
        filterConditions,
        searchCondition,
        finalSortBy,
        finalSortOrder,
        resourceRid,
        search,
        accountId
      );
    } catch (err) {
      console.log("Error ", err);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Creates a new resource cost record in the specified account schema.
   *
   * This method:
   * 1. Validates and creates schema/table if needed
   * 2. Sets the correct schema context
   * 3. Creates resource cost record with provided data
   *
   * @param resourceCost - Object containing resource cost details including costs, dates, and identifiers
   * @returns Promise resolving to status object with created resource cost data or error message
   */
  async createResourceCost(
    resourceCost: IResourceCost,
    userId: string,
    userPreference: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }> {
    try {
      const {
        eid,
        account_rid,
        resource_type_rid,
        resource_rid,
        resource_code,
        effective_from,
        end_date,
        // cost_frequency,
        // cost,
        // annual_cost,
        // semi_annual_cost,
        // monthly_cost,
        // weekly_cost,
        // bi_weekly_cost,
        // daily_cost,
        // hourly_cost,
        salary,
        deductions,
        insurance,
        bonus,
        resource_cost,
        effort_in_hrs,
        currency_rid,
        accountNumber,
        resource_number,
        comments,
        fiscal_year,
      } = resourceCost;
      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      
      const [resourceCostTableCreated, timelineTableCreated] =
        await Promise.all([
          resourceCostSchemaService.validateSchema(schemaName, "resource_cost"),
          resourceCostSchemaService.validateSchema(
            schemaName,
            "resource_cost_timeline"
          ),
        ]);
      if (!resourceCostTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Account schema or resource_cost table could not be created",
        };
      } else if (!timelineTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Account schema or resource_cost_timeline table could not be created",
        };
      }
      let createdResourceCost;
      let eventStatus = "Success";
      let errorMessage = "";

      try {
        const costFields = {
          deductions,
          insurance,
          bonus,
          effort_in_hrs,
          resource_cost,
          salary,
        };

        const costValues = Object.entries(costFields).reduce(
          (acc, [key, value]) => {
            // Normalize empty string to null
            if (value === "" || value === null || value === undefined) {
              acc[key] = null;
            } else {
              try {
                // Convert valid string/number to Decimal
                acc[key] = new Decimal(value).toString();
              } catch (error) {
                throw new Error(`Invalid number format for ${key}: ${value}`);
              }
            }
            return acc;
          },
          {} as Record<string, string | null>
        );

        const sequelize = await this.getOrgSequelize();
        const mainDbSequelize = await this.getMainDbSequelize();
        
        // Get currency threshold
        const currencyThreshold = await getCurrencyThreshold(mainDbSequelize, currency_rid);

        ResourceCost.initialize(sequelize, schemaName);
        const effectiveFrom = this.formatDateForDb(effective_from as string);
        const endDate = this.formatDateForDb(end_date as string);

        // Calculate resource cost
        const calculatedResourceCost = Number(
          new Decimal(salary || 0)
            .plus(bonus || 0)
            .plus(insurance || 0)
            .plus(resource_cost || 0)
            .minus(deductions || 0)
        );

        let status = "Active";
        const statusMap = await getResourceStatuses(mainDbSequelize);
        const activeStatusId = statusMap?.get(status);
        // Check for duplicate record
        const existingCost = await ResourceCost.findOne({
          where: {
            resource_rid,
            effective_from: effectiveFrom,
            end_date: endDate,
            ...costValues,
            fiscal_year,
            comments,
            currency_rid,
           status_rid: { 
            [Op.in]: [
              statusMap?.get('Active'), 
              statusMap?.get('Anomaly'), 
              statusMap?.get('Duplicate')
            ].filter(Boolean) as string[] // Filter out undefined and assert as string[]
          },
            net_resource_cost: calculatedResourceCost,
            account_rid,
          },
        });

        if (existingCost && (userPreference === null || userPreference === "")) {
            return {
                statusCode: HttpStatus.PROMPT,
                message: "Entered compensation details already exists for the resource. Would you like to create another compensation with same values?",
                data: {
                    resourceCost: existingCost
                }
            };
        }

        if (effort_in_hrs!== undefined && Number(effort_in_hrs) > 3000) {
          status = "Anomaly";
        } else if (
          (resource_cost !== undefined && currencyThreshold !== null && Number(resource_cost) > currencyThreshold) ||
          (salary !== undefined && currencyThreshold !== null && Number(salary) > currencyThreshold)
        ) {
          status = "Anomaly";
        }
        const status_rid = statusMap?.get(status);
        createdResourceCost = await ResourceCost.create({
          eid,
          account_rid,
          resource_type_rid,
          resource_rid,
          resource_number,
          resource_code,
          effective_from: effectiveFrom || null,
          end_date: endDate || null,
          // cost_type: cost_frequency,
          // cost: cost,
          // ...frequency,
          ...costValues,
          net_resource_cost: calculatedResourceCost,
          currency_rid: currency_rid || undefined,
          fiscal_year,
          comments,
          status_rid,
          created_datetime: new Date(),
          created_by: userId
        });

        if (resource_rid) {
          try {
            ResourceFiscal.initialize(sequelize, schemaName);
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid: resource_rid,
              },
            });
            if (existingFiscal) {
              await existingFiscal.update({
                ...costValues,
                modified_datetime: new Date(),
                modified_by: userId,
              });
            }
          } catch (fiscalError) {
            console.error("Error updating resource fiscal:", fiscalError);
          }
        }
      } catch (error) {
        eventStatus = "Failure";
        errorMessage = (error as Error).message;
      }

      try {
        await this.createResourceCostTimeline(
          createdResourceCost ? createdResourceCost : {},
          "Create",
          eventStatus,
          userId,
          account_rid,
          schemaName
        );
      } catch (timelineError) {
        console.error("Failed to create timeline entry:", timelineError);
      }

      if (eventStatus === "Failure") {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: errorMessage,
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: createdResourceCost,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Creates a record in the ResourceCostTimeline table using Sequelize ORM
   * @param resourceCost - The created resource cost object
   * @param eventName - The event name (Create, Update, Delete)
   * @param eventStatus - The event status
   * @param modifiedBy - The user who performed the action
   * @param account_rid - The account RID
   * @param sequelize - The sequelize instance
   */
  private async createResourceCostTimeline(
    resourceCost: any,
    eventName: string,
    eventStatus: string,
    modifiedBy: string,
    account_rid: string,
    schemaName: string
  ): Promise<void> {
    try {
      const sequelize = await this.getOrgSequelize();
      ResourceCostTimeline.initialize(sequelize, schemaName);
      // Create the timeline entry using Sequelize model
      await ResourceCostTimeline.create({
        account_rid: account_rid,
        event_name: eventName,
        event_status: eventStatus,
        entity_rid: resourceCost.rid || "",
        created_datetime: new Date(),
        created_by: modifiedBy
      });
    } catch (error) {
      console.error("Failed to create timeline entry:", error);
      throw error;
    }
  }

  /**
   * Updates an existing resource cost record in the specified account schema.
   *
   * This method:
   * 1. Validates the schema exists
   * 2. Sets the correct schema context
   * 3. Updates the resource cost record with the provided data
   *
   * @param resourceCostData - Object containing updated resource cost details and identifiers
   * @returns Promise resolving to status object with updated resource cost data or error message
   */
  async updateResourceCost(
    resourceCostData: IUpdateResourceCost,
    userId: string,
    userPreference: string,
  ) {
    try {
      const {
        eid,
        effective_from,
        end_date,
        // cost_frequency,
        // cost,
        // annual_cost,
        // semi_annual_cost,
        // monthly_cost,
        // weekly_cost,
        // bi_weekly_cost,
        // daily_cost,
        // hourly_cost,
        salary,
        deductions,
        insurance,
        bonus,
        resource_cost,
        effort_in_hrs,
        currency_rid,
        resource_rid,
        accountNumber,
        rid,
        fiscal_year,
        comments,
        status_rid,
      } = resourceCostData;

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableName = "resource_cost_timeline";
      const schemaAndTableValidation =
        await resourceCostSchemaService.validateSchema(schemaName, tableName);

      // Also create the history table
      await resourceCostSchemaService.validateSchema(
        schemaName,
        "resource_cost_history"
      );

      if (!schemaAndTableValidation) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Account schema does not exist",
        };
      }

      const sequelize = await this.getOrgSequelize();
      ResourceCost.initialize(sequelize, schemaName);
      // Get the original resource cost before updating
      const mainDbSequelize = await this.getMainDbSequelize();
       const statusMap = await getResourceStatuses(mainDbSequelize);
        const activeStatusId = statusMap?.get("Active");
      const originalResourceCost = await ResourceCost.findOne({
        where: { rid: rid },
      });

      if (!originalResourceCost) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Resource cost record not found",
        };
      }

      if(originalResourceCost.status_rid === statusMap?.get("Duplicate")){
         return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Duplicate Record cannot be update. Please resolve duplicate status. Alternately you can reject this record and add new compensation."
         }
      }

      // Check for any other records with same values and Duplicate status
      const duplicateRecords = await ResourceCost.findOne({
        where: {
          resource_rid: originalResourceCost.resource_rid,
          account_rid: originalResourceCost.account_rid,
          effective_from: originalResourceCost.effective_from,
          end_date: originalResourceCost.end_date,
          salary: originalResourceCost.salary,
          deductions: originalResourceCost.deductions,
          insurance: originalResourceCost.insurance,
          bonus: originalResourceCost.bonus,
          resource_cost: originalResourceCost.resource_cost,
          effort_in_hrs: originalResourceCost.effort_in_hrs,
          fiscal_year: originalResourceCost.fiscal_year,
          comments: originalResourceCost.comments,
          currency_rid: originalResourceCost.currency_rid,
          status_rid: statusMap?.get("Duplicate")
        }
      });

      if (duplicateRecords) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: HttpStatus.BAD_REQUEST_MESSAGE,
          errorMessage: "Please resolve the other duplicate records of this data."
        }
      }

      try {
        const costFields = {
          deductions,
          insurance,
          bonus,
          effort_in_hrs,
          resource_cost,
          salary,
        };

        const costValues = Object.entries(costFields).reduce(
          (acc, [key, value]) => {
            // Normalize empty string to null
            if (value === "" || value === null || value === undefined) {
              acc[key] = null;
            } else {
              try {
                // Convert valid string/number to Decimal
                acc[key] = new Decimal(value).toString();
              } catch (error) {
                throw new Error(`Invalid number format for ${key}: ${value}`);
              }
            }

            return acc;
          },
          {} as Record<string, string | null>
        );

        
        
        // Get currency threshold
        const currencyThreshold = await getCurrencyThreshold(mainDbSequelize, currency_rid);

        const effectiveFrom = this.formatDateForDb(effective_from as string);
        const endDate = this.formatDateForDb(end_date as string);
        // Calculate resource cost
        const calculatedResourceCost = Number(
          new Decimal(salary || 0)
            .plus(bonus || 0)
            .plus(insurance || 0)
            .plus(resource_cost || 0)
            .minus(deductions || 0)
        );

        let resourceCostStatus = status;
        
        // Check for duplicate record
        const existingCost = await ResourceCost.findOne({
          where: {
            resource_rid,
            effective_from: effectiveFrom,
            end_date: endDate,
            ...costValues,
            fiscal_year,
            comments,
            currency_rid,
            status_rid: { 
            [Op.in]: [
              statusMap?.get('Active'), 
              statusMap?.get('Anomaly'), 
              statusMap?.get('Duplicate')
            ].filter(Boolean) as string[] // Filter out undefined and assert as string[]
          },
            net_resource_cost: calculatedResourceCost,
          },
        });

        if (existingCost && (userPreference === null || userPreference === "")) {
          return {
            statusCode: HttpStatus.PROMPT,
            message: "Compensation details already exists for the resource. Would to like proceed updating with same values ?",
            data: {
              affectedCounts: 0,
              resourceCost: [],
            },
        };
        } else if (effort_in_hrs!== undefined && Number(effort_in_hrs) > 3000) {
          resourceCostStatus = "Anomaly";
        } else if (
          (resource_cost !== undefined && currencyThreshold !== null && Number(resource_cost) > currencyThreshold) ||
          (salary !== undefined && currencyThreshold !== null && Number(salary) > currencyThreshold)
        ) {
          resourceCostStatus = "Anomaly";
        }
        const status_rid = statusMap?.get(resourceCostStatus);
        const [affectedCounts, affectedRows] = await ResourceCost.update(
          {
            eid,
            effective_from: effectiveFrom || null,
            end_date: endDate || null,
            // cost_type: cost_frequency,
            // cost: cost,
            // ...frequency,
            ...costValues,
            net_resource_cost: calculatedResourceCost,
            currency_rid,
            fiscal_year,
            comments,
            rid,
            status_rid,
            modified_datetime: new Date(),
            modified_by: userId,
          },
          {
            where: {
              rid: rid,
            },
            returning: true,
          }
        );

        if (affectedRows[0].resource_rid) {
          try {
            ResourceFiscal.initialize(sequelize, schemaName);
            // Check if a record already exists for this resource and fiscal year
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid: affectedRows[0].resource_rid,
              },
            });

            if (existingFiscal) {
              await existingFiscal.update({
                // ...frequency,
                ...costValues,
                modified_datetime: new Date(),
                modified_by: userId,
              });
            }
          } catch (fiscalError) {
            console.error("Error updating resource fiscal:", fiscalError);
            // Continue with the process even if fiscal update fails
          }
        }

        // Create history records for the changes
        if (affectedCounts > 0) {
          await this.createResourceCostHistory(
            originalResourceCost.toJSON(),
            affectedRows[0],
            userId,
            accountNumberFetched
          );

          // Also log to timeline
          await this.createResourceCostTimeline(
            affectedRows[0],
            "Update",
            "Success",
            userId,
            originalResourceCost.account_rid,
            schemaName
          );
        }

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            affectedCounts,
            resourceCost: affectedRows[0],
          },
        };
      } catch (err) {
        // Log the failed update to timeline
        try {
          await this.createResourceCostTimeline(
            originalResourceCost,
            "Update",
            "Failed",
            "",
            originalResourceCost.account_rid,
            schemaName
          );
        } catch (timelineError) {
          console.error(
            "Failed to create timeline entry for failed update:",
            timelineError
          );
        }

        throw err;
      }
    } catch (err) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

  /**
   * Creates history records for changed attributes in resource cost
   * @param oldResourceCost - The original resource cost object before changes
   * @param newResourceCost - The updated resource cost object after changes
   * @param modifiedBy - The user who performed the action
   */
  private async createResourceCostHistory(
    oldResourceCost: any,
    newResourceCost: any,
    modifiedBy: string,
    accountNumber: string
  ): Promise<void> {
    try {
      const sequelize = await this.getOrgSequelize();
      if (!sequelize) {
        throw new Error("Database connection not available");
      }

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Make sure we're in the right schema context
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableExists = await resourceCostSchemaService.validateSchema(
        schemaName,
        "resource_cost_history"
      );
      if (!tableExists) {
        throw new Error(
          `Table resource_cost_history  or account schema does not exist in schema ${schemaName}`
        );
      }

      // Define the attributes to track changes for
      const trackedAttributes = [
        "eid",
        "effective_from",
        "end_date",
        // "annual_cost",
        // "semi_annual_cost",
        // "monthly_cost",
        // "weekly_cost",
        // "bi_weekly_cost",
        // "daily_cost",
        // "hourly_cost",
        "salary",
        "deductions",
        "insurance",
        "bonus",
        "resource_cost",
        "net_resource_cost",
        "effort_in_hrs",
        "currency_rid",
        "fiscal_year",
        "comments",
        "status",
      ];

      // Track changes for each attribute individually to better isolate errors
      for (const attribute of trackedAttributes) {
        try {
          const oldValue = oldResourceCost[attribute];
          const newValue = newResourceCost[attribute];

          // Only create history record if the value has changed
          if (
            oldValue !== newValue &&
            (oldValue !== undefined || newValue !== undefined)
          ) {
            // Format date values properly
            let formattedOldValue = oldValue;
            let formattedNewValue = newValue;

            if (attribute === "effective_from" || attribute === "end_date") {
              if (oldValue)
                formattedOldValue = new Date(oldValue)
                  .toISOString()
                  .split("T")[0];
              if (newValue)
                formattedNewValue = new Date(newValue)
                  .toISOString()
                  .split("T")[0];
            }

            ResourceCostHistory.initialize(sequelize, schemaName);

            // Create individual record to isolate errors
            await ResourceCostHistory.create({
              resource_cost_rid: newResourceCost.rid,
              attribute_name: attribute,
              old_value:
                formattedOldValue !== undefined
                  ? String(formattedOldValue)
                  : "",
              new_value:
                formattedNewValue !== undefined
                  ? String(formattedNewValue)
                  : "",
              created_by: modifiedBy,
              created_datetime: new Date(),
            });
          }
        } catch (attrError) {
          console.error(
            `Error creating history for attribute ${attribute}:`,
            attrError
          );
          // Continue with other attributes even if one fails
        }
      }
    } catch (error) {
      console.error("Failed to create history entries:", error);
      // Continue execution even if history creation fails
    }
  }

  /**
   * Retrieves a specific resource cost record by ID from the specified account schema.
   * Includes the associated Resource record in the result.
   *
   * @param id - Unique identifier of the resource cost record
   * @param accountNumber - Account identifier for schema selection
   * @returns Promise resolving to status object with resource cost data or error message
   */
  async resourceCostById(id: string, accountNumber: string) {
    try {
      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const validateSchema = await resourceCostSchemaService.validateSchema(
        schemaName,
        "resource_cost"
      );

      if (!validateSchema) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Account schema does not exist",
        };
      }

      const sequelize = await this.getOrgSequelize();
      ResourceCost.initialize(sequelize, schemaName);
      const resourceCostById = await ResourceCost.findOne({
        where: {
          rid: id,
        },
        include: [
          {
            model: Resources,
            required: true,
            as: "Resource",
          },
        ],
      });
      // 1. Fetch ResourceCost with Resource (from DB1)
      const resourceCost = await ResourceCost.findOne({
        where: { rid: id },
        include: [{
          model: Resources,
          as: "Resource",
          required: true,
        }],
      });


      let currencyName = "";
      let currencyCode = "";
      let currencySymbol = "";
      let statusName = "";
      // Transform the response to simplify cost frequency data
      if (resourceCostById) {
        const costData = resourceCostById.toJSON();
        const sequelize = await this.getMainDbSequelize();
        await resourceCostSchemaService.assignCurrencyRid(costData, sequelize);
        // Query the currency table in the main database
        const [currencyResult] = await sequelize.query(
          `SELECT currency_name,currency_code,currency_symbol FROM public.currency WHERE rid = :currency_rid`,
          {
            replacements: { currency_rid: costData.currency_rid },
            type: "SELECT",
          }
        );

         const [statusResult] = await sequelize.query(
          `SELECT resource_status_name as status_name FROM public.resource_status WHERE rid = :status_rid`,
          {
            replacements: { status_rid: costData.status_rid },
            type: "SELECT",
          }
        );
        if (statusResult) {
          statusName = (statusResult as any).status_name;
        }
        if (currencyResult) {
          currencyName = (currencyResult as any).currency_name;
          currencyCode = (currencyResult as any).currency_code;
          currencySymbol = (currencyResult as any).currency_symbol;
        }

        // Fetch user names for created_by and modified_by
        const userNames = await this.fetchUserNames({
          created_by: costData.created_by,
          modified_by: costData.modified_by,
        });

        // // Find which cost frequency has a value
        // const frequencyMap: Record<string, string> = {
        //   annual_cost: "annual",
        //   semi_annual_cost: "semi_annual",
        //   monthly_cost: "monthly",
        //   weekly_cost: "weekly",
        //   bi_weekly_cost: "bi_weekly",
        //   daily_cost: "daily",
        //   hourly_cost: "hourly",
        // };

        // let foundFrequency = null;
        // let costValue = null;

        // Check each cost field to find the one with a value
        // for (const [key, value] of Object.entries(frequencyMap)) {
        //   // Use type assertion to tell TypeScript this is a valid key access
        //   const costFieldValue = (costData as Record<string, any>)[key];
        //   if (
        //     costFieldValue !== null &&
        //     costFieldValue !== undefined &&
        //     costFieldValue !== ""
        //   ) {
        //     foundFrequency = value;
        //     costValue = costFieldValue;
        //     break;
        //   }
        // }

        costData.created_by = userNames.created_by_name;
        costData.modified_by = userNames.modified_by_name;

        // Format dates to yyyy-mm-dd format
        if (costData.effective_from) {
          costData.effective_from = moment(costData.effective_from).format(
            "YYYY-MM-DD"
          ) as any;
        }
        if (costData.end_date) {
          costData.end_date = moment(costData.end_date).format(
            "YYYY-MM-DD"
          ) as any;
        }

        const resourceInfo = (costData as any).Resource;

        if (resourceInfo) {
          resourceInfo.resource_startdate = moment(
            resourceInfo.resource_startdate
          ).format("YYYY-MM-DD") as any;
          resourceInfo.resource_enddate = moment(
            resourceInfo.resource_enddate
          ).format("YYYY-MM-DD") as any;
           if (resourceInfo.status_rid) {
             const sequelize = await this.getMainDbSequelize();
            const status = await sequelize.query(
              `SELECT status_name FROM status WHERE rid = :rid`,
              {
                replacements: { rid: resourceInfo.status_rid },
                type: "SELECT",
                plain: true,
              }
            );
            resourceInfo.status_name = status?.status_name || "Unknown";
  }
        }

        //Create a new response object with simplified cost data
        const simplifiedCostData = {
          ...costData,
          currency_name: currencyName,
          currency_code: currencyCode,
          currency_symbol: currencySymbol,
          status_name:statusName
        };

        // // Remove the individual cost frequency fields
        // delete (simplifiedCostData as Record<string, any>).annual_cost;
        // delete (simplifiedCostData as Record<string, any>).semi_annual_cost;
        // delete (simplifiedCostData as Record<string, any>).monthly_cost;
        // delete (simplifiedCostData as Record<string, any>).weekly_cost;
        // delete (simplifiedCostData as Record<string, any>).bi_weekly_cost;
        // delete (simplifiedCostData as Record<string, any>).daily_cost;
        // delete (simplifiedCostData as Record<string, any>).hourly_cost;

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            resourceCostById: simplifiedCostData,
          },
        };
      }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCostById,
        },
      };
    } catch (err) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }

async acceptResourceCostStatus(id: string, accountNumber: string, action: string, type: string) {
  try {
    let { accountNumber: accountNumberFetched } =
      await this.schemaService.fetchAccountByNumber(accountNumber);

    const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
    const validateSchema = await resourceCostSchemaService.validateSchema(
      schemaName,
      "resource_cost"
    );

    if (!validateSchema) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Account schema does not exist",
      };
    }

    const sequelize = await this.getOrgSequelize();
    const mainDbSequelize = await this.getMainDbSequelize();
    ResourceCost.initialize(sequelize, schemaName);

    let resourceCostStatus = "Active";
    const statusMap = await getResourceStatuses(mainDbSequelize);
    const activeStatusId = statusMap?.get("Active");

    // Only check for anomaly conditions if handling duplicate type
    if (type === 'Duplicate') {
      const resourceCostBy = await ResourceCost.findOne({
        where: {
          rid: id,
        },
      });

      if (resourceCostBy) {
        // Get currency threshold based on resource cost's currency_rid
        const currencyThreshold = await getCurrencyThreshold(mainDbSequelize, resourceCostBy.currency_rid);

        if (
          resourceCostBy.effort_in_hrs &&
          Number(resourceCostBy.effort_in_hrs) > 3000
        ) {
          resourceCostStatus = "Anomaly";
        } else if (
          (resourceCostBy?.salary && currencyThreshold !== null && Number(resourceCostBy.salary) > currencyThreshold) ||
          (resourceCostBy?.resource_cost && currencyThreshold !== null && Number(resourceCostBy.resource_cost) > currencyThreshold)
        ) {
          resourceCostStatus = "Anomaly";
        }
      }
    }
     const updateStatus = await ResourceCost.update(
      {
        status_rid: action === "accept" ?  statusMap?.get(resourceCostStatus) : statusMap?.get("Inactive"),
      },
      {
        where: {
          rid: id,
        },
      }
    );

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        updateStatus,
      },
    };
  } catch (err) {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage: (err as Error).message,
    };
  }
}

  /**
   * Creates a standardized error response object for service errors.
   *
   * @param err - Error object that was caught
   * @returns Object with error status code, message, and error details
   */
  private throwServiceError(err: Error): {
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

  /**
   * Fetches user names for user IDs from the main database
   * @param userIds - Object containing user IDs (created_by, modified_by)
   * @returns Promise resolving to object with user names
   */
  private async fetchUserNames(userIds: {
    created_by?: string;
    modified_by?: string;
  }): Promise<{ created_by_name: string; modified_by_name: string }> {
    const result = {
      created_by_name: "",
      modified_by_name: "",
    };

    try {
      const sequelize = await this.getMainDbSequelize();

      // Fetch created_by user name if ID exists
      if (userIds.created_by) {
        const [createdByUser] = await sequelize.query(
          `SELECT concat(first_name, ' ', last_name) as full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.created_by },
            type: "SELECT",
          }
        );

        if (createdByUser) {
          result.created_by_name = (createdByUser as any).full_name;
        }
      }

      // Fetch modified_by user name if ID exists
      if (userIds.modified_by) {
        const [modifiedByUser] = await sequelize.query(
          `SELECT concat(first_name, ' ', last_name) as full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.modified_by },
            type: "SELECT",
          }
        );

        if (modifiedByUser) {
          result.modified_by_name = (modifiedByUser as any).full_name;
        }
      }
    } catch (error) {
      console.error("Error fetching user names:", error);
      // Return empty strings if there's an error
    }

    return result;
  }

  /**
   * Properly formats a date string for database storage
   * @param dateString Date string in MM/DD/YYYY format
   * @returns Properly formatted date for database storage
   */
  private formatDateForDb(dateString?: string): Date | null {
    if (!dateString) return null;

    // Parse the date using moment to ensure consistent handling
    const date = moment(dateString, "YYYY-MM-DD", true);
    if (!date.isValid()) return null;

    // Set the time to noon to avoid timezone issues
    date.hour(12).minute(0).second(0).millisecond(0);

    return date.toDate();
  }
}

async function getResourceStatuses(
  mainDbSequelize: Sequelize,
): Promise<Map<string, string> | null> {
  try {
    const resourceStatus = `SELECT rid, resource_status_name FROM resource_status`;
    const results = await mainDbSequelize.query(resourceStatus, {
      type: "SELECT"
    });

    if (!results || !Array.isArray(results)) {
      return null;
    }

    // Create lookup maps
    const statusMap = new Map(results.map((st: any) => [st.resource_status_name,st.rid]));
        

    return statusMap;
  } catch (error) {
    console.error('Error fetching resource statuses:', error);
    return null;
  }
}
  

/**
 * Fetches the currency threshold from the currency table.
 * Falls back to USD if currency_rid is not provided.
 *
 * @param mainDbSequelize - Sequelize instance for the main DB.
 * @param currency_rid - Optional currency RID to lookup.
 * @returns currency_threshold value or null if not found.
 */
async function getCurrencyThreshold(
  mainDbSequelize: Sequelize,
  currency_rid?: string
): Promise<number | null> {
  let currencyResult;
  console.log("currency_rid :",currency_rid);
  if (currency_rid) {
    [currencyResult] = await mainDbSequelize.query(
      `SELECT currency_threshold FROM public.currency WHERE rid = :currency_rid`,
      {
        replacements: { currency_rid },
        type: "SELECT",
      }
    );
  } else {
    [currencyResult] = await mainDbSequelize.query(
      `SELECT currency_threshold FROM public.currency WHERE currency_code = 'USD'`,
      {
        type: "SELECT",
      }
    );
  }

  return (currencyResult as any)?.currency_threshold ?? null;
}

export default ResourceCostService;
