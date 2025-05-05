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
      const schemaName = `platform_v2_${accountNumberFetched}`;
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
        search
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
      const schemaName = `platform_v2_${accountNumberFetched}`;
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
        search
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
    userId: string
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
        resource_type,
        resource_rid,
        resource_ref_id,
        effective_date,
        end_date,
        cost_frequency,
        cost,
        currency_rid,
        accountNumber,
        resource_number,
      } = resourceCost;

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      const schemaName = `platform_v2_${accountNumberFetched}`;
      // Create both tables in parallel for better performance
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
      let frequency = {};

      try {
        let costField;
        switch (cost_frequency) {
          case "annual":
            frequency = { annual_cost: cost };
            costField = "annual_cost";
            break;
          case "semi_annual":
            frequency = { semi_annual_cost: cost };
            costField = "semi_annual_cost";
            break;
          case "monthly":
            frequency = { monthly_cost: cost };
            costField = "monthly_cost";
            break;
          case "weekly":
            frequency = { weekly_cost: cost };
            costField = "weekly_cost";
            break;
          case "bi_weekly":
            frequency = { bi_weekly_cost: cost };
            costField = "bi_weekly_cost";
            break;
          case "daily":
            frequency = { daily_cost: cost };
            costField = "daily_cost";
            break;
          case "hourly":
            frequency = { hourly_cost: cost };
            costField = "hourly_cost";
            break;
          default:
            throw new Error(`Invalid cost frequency: ${cost_frequency}`);
        }

        const sequelize = await this.getOrgSequelize();
        ResourceCost.initialize(sequelize, schemaName);
        const effectiveDate = this.formatDateForDb(effective_date as string);
        const endDate = this.formatDateForDb(end_date as string);

        if (effectiveDate && endDate) {
          const existingCost = await ResourceCost.findOne({
            where: {
              resource_rid,
              effective_date: effectiveDate,
              end_date: endDate,
              [costField]: { [Op.ne]: null },
            },
          });

          if (existingCost) {
            throw new Error("Compensation already exists for this duration.");
          }
        }

        // Use the model's create method to leverage default values
        createdResourceCost = await ResourceCost.create({
          eid,
          account_rid,
          resource_type,
          resource_rid,
          resource_number,
          resource_ref_id,
          effective_date: effectiveDate || null,
          end_date: endDate || null,
          ...frequency,
          currency_rid: currency_rid || undefined,
          created_datetime: new Date(),
          created_by: userId,
          modified_by: userId,
        });

        if (resource_rid) {
          try {
            ResourceFiscal.initialize(sequelize, schemaName);
            // Check if a record already exists for this resource and fiscal year
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid: resource_rid,
              },
            });

            if (existingFiscal) {
              await existingFiscal.update({
                ...frequency,
                modified_datetime: new Date(),
                modified_by: userId,
              });
            }
          } catch (fiscalError) {
            console.error("Error updating resource fiscal:", fiscalError);
            // Continue with the process even if fiscal update fails
          }
        }
      } catch (error) {
        eventStatus = "Failure";
        errorMessage = (error as Error).message;
      }

      //Try to log the event in the timeline table
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
        // Continue execution even if timeline creation fails
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
        modified_datetime: new Date(),
        modified_by: modifiedBy,
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
    userId: string
  ) {
    try {
      const {
        eid,
        effective_date,
        end_date,
        cost_frequency,
        cost,
        currency_rid,
        accountNumber,
        rid,
        status,
      } = resourceCostData;

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);

      const schemaName = `platform_v2_${accountNumberFetched}`;
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

      let frequency = {};
      try {
        // First, create an object with all cost frequency fields set to null
        const clearFrequencies = {
          annual_cost: null as null | number,
          semi_annual_cost: null as null | number,
          monthly_cost: null as null | number,
          weekly_cost: null as null | number,
          bi_weekly_cost: null as null | number,
          daily_cost: null as null | number,
          hourly_cost: null as null | number,
        };

        frequency = {
          ...clearFrequencies,
        };

        switch (cost_frequency) {
          case "annual":
            (frequency as { annual_cost: number | null }).annual_cost = cost;
            break;
          case "semi_annual":
            (
              frequency as { semi_annual_cost: number | null }
            ).semi_annual_cost = cost;
            break;
          case "monthly":
            (frequency as { monthly_cost: number | null }).monthly_cost = cost;
            break;
          case "weekly":
            (frequency as { weekly_cost: number | null }).weekly_cost = cost;
            break;
          case "bi_weekly":
            (frequency as { bi_weekly_cost: number | null }).bi_weekly_cost =
              cost;
            break;
          case "daily":
            (frequency as { daily_cost: number | null }).daily_cost = cost;
            break;
          case "hourly":
            (frequency as { hourly_cost: number | null }).hourly_cost = cost;
            break;
          default:
            throw new Error(`Invalid cost frequency: ${cost_frequency}`);
        }

        const effectiveDate = this.formatDateForDb(effective_date as string);
        const endDate = this.formatDateForDb(end_date as string);
        if (effectiveDate && endDate) {
          const existingRow = await ResourceCost.findOne({
            where: {
              rid: rid,
            },
          });
          if (
            existingRow &&
            existingRow.effective_date !== effectiveDate &&
            existingRow.end_date !== endDate &&
            Number(existingRow[`${cost_frequency}_cost`]) !== Number(cost)
          ) {
            const existingCost = await ResourceCost.findOne({
              where: {
                resource_rid: existingRow.resource_rid,
                effective_date: effectiveDate,
                end_date: endDate,
                [`${cost_frequency}_cost`]: { [Op.ne]: null },
              },
            });

            if (existingCost) {
              throw new Error("Compensation already exists for this duration.");
            }
          }
        }
        const [affectedCounts, affectedRows] = await ResourceCost.update(
          {
            eid,
            effective_date: effectiveDate || null,
            end_date: endDate || null,
            ...frequency,
            currency_rid,
            rid,
            status,
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
                ...frequency,
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
            accountNumber
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
      const schemaName = `platform_v2_${accountNumberFetched}`;
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
        "effective_date",
        "end_date",
        "annual_cost",
        "semi_annual_cost",
        "monthly_cost",
        "weekly_cost",
        "bi_weekly_cost",
        "daily_cost",
        "hourly_cost",
        "currency_rid",
        "fiscal_year",
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

            if (attribute === "effective_date" || attribute === "end_date") {
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
              modified_by: modifiedBy,
              modified_datetime: new Date(),
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
      const schemaName = `platform_v2_${accountNumberFetched}`;
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

      let currencyName = "";
      let currencyCode = "";
      let currencySymbol = "";
      // Transform the response to simplify cost frequency data
      if (resourceCostById) {
        const costData = resourceCostById.toJSON();
        const sequelize = await this.getMainDbSequelize();
        // Query the currency table in the main database
        const [currencyResult] = await sequelize.query(
          `SELECT currency_name,currency_code,currency_symbol FROM public.currency WHERE rid = :currency_rid`,
          {
            replacements: { currency_rid: costData.currency_rid },
            type: "SELECT",
          }
        );

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

        // Find which cost frequency has a value
        const frequencyMap: Record<string, string> = {
          annual_cost: "annual",
          semi_annual_cost: "semi_annual",
          monthly_cost: "monthly",
          weekly_cost: "weekly",
          bi_weekly_cost: "bi_weekly",
          daily_cost: "daily",
          hourly_cost: "hourly",
        };

        let foundFrequency = null;
        let costValue = null;

        // Check each cost field to find the one with a value
        for (const [key, value] of Object.entries(frequencyMap)) {
          // Use type assertion to tell TypeScript this is a valid key access
          const costFieldValue = (costData as Record<string, any>)[key];
          if (
            costFieldValue !== null &&
            costFieldValue !== undefined &&
            costFieldValue !== ""
          ) {
            foundFrequency = value;
            costValue = costFieldValue;
            break;
          }
        }

        costData.created_by = userNames.created_by_name;
        costData.modified_by = userNames.modified_by_name;

        // Format dates to MM/DD/YYYY
        if (costData.effective_date) {
          costData.effective_date = moment(costData.effective_date).format(
            "MM/DD/YYYY"
          ) as any;
        }
        if (costData.end_date) {
          costData.end_date = moment(costData.end_date).format(
            "MM/DD/YYYY"
          ) as any;
        }

        const resourceInfo = (costData as any).Resource;

        if (resourceInfo) {
          resourceInfo.resource_startdate = moment(
            resourceInfo.resource_startdate
          ).format("MM/DD/YYYY") as any;
          resourceInfo.resource_enddate = moment(
            resourceInfo.resource_enddate
          ).format("MM/DD/YYYY") as any;
        }

        // Create a new response object with simplified cost data
        const simplifiedCostData = {
          ...costData,
          cost_frequency: foundFrequency,
          cost: costValue,
          currency_name: currencyName,
          currency_code: currencyCode,
          currency_symbol: currencySymbol,
        };

        // Remove the individual cost frequency fields
        delete (simplifiedCostData as Record<string, any>).annual_cost;
        delete (simplifiedCostData as Record<string, any>).semi_annual_cost;
        delete (simplifiedCostData as Record<string, any>).monthly_cost;
        delete (simplifiedCostData as Record<string, any>).weekly_cost;
        delete (simplifiedCostData as Record<string, any>).bi_weekly_cost;
        delete (simplifiedCostData as Record<string, any>).daily_cost;
        delete (simplifiedCostData as Record<string, any>).hourly_cost;

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
          `SELECT full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
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
          `SELECT full_name FROM public."user" WHERE rid = :userId LIMIT 1`,
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
    const date = moment(dateString, "MM/DD/YYYY", true);
    if (!date.isValid()) return null;

    // Set the time to noon to avoid timezone issues
    date.hour(12).minute(0).second(0).millisecond(0);

    return date.toDate();
  }
}

export default ResourceCostService;
