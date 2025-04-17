import { ResourceCost } from "../models/resourceCost";
import { Resources } from "../models/resource";
import  {IResourceCost, IUpdateResourceCost} from "../utils/types";
import { HttpStatus } from "../utils/constants";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";
import resourceCostSchemaService from "../services/resourceCostSchemaService";
import SchemaService from "./schemaService";
import { initOrgSequelize } from "../config/orgDataSource";
import { ResourceFiscal } from "../models/resourceFiscal";

class ResourceCostService {
  private resourceCostRepository: typeof ResourceCost | null;
  private schemaService: SchemaService;

  constructor() {
    this.resourceCostRepository = null;
    this.schemaService = new SchemaService();
  }

  /**
   * Retrieves the Resource Cost model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof ResourceCost} - The model for Resource cost entity.
   */
  private getResourceCostRepository(): typeof ResourceCost {
    if (!this.resourceCostRepository) {
      this.resourceCostRepository = ResourceCost;
    }
    return this.resourceCostRepository;
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
    fiscalYear: number
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any; count: number };
  }> {
    try {
      const repository = this.getResourceCostRepository();
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

      // Get database connection and ensure it's available
      const sequelize = repository.sequelize;
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
      return await resourceCostSchemaService.executeQueries(
        schemaName,
        filterConditions,
        searchCondition,
        finalSortBy,
        finalSortOrder,
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
   * Creates an error response with the specified message
   *
   * @param errorMessage - The error message to include
   * @returns Error response object
   */
  private createErrorResponse(errorMessage: string) {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage,
    };
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
  async createResourceCost(resourceCost: IResourceCost): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceCost: any };
  }> {
    try {
      const repository = this.getResourceCostRepository();
      const {
        eid,
        account_rid,
        resource_type,
        resource_rid,
        resource_ref_id,
        effective_date,
        end_date,
        annual_cost,
        semi_annual_cost,
        monthly_cost,
        weekly_cost,
        bi_weekly_cost,
        daily_cost,
        hourly_cost,
        currency_rid,
        accountNumber,
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

      try {
        // Use the model's create method to leverage default values
        createdResourceCost = await repository.create({
          eid,
          account_rid,
          resource_type,
          resource_rid,
          resource_ref_id,
          effective_date,
          end_date,
          annual_cost,
          semi_annual_cost,
          monthly_cost,
          weekly_cost,
          bi_weekly_cost,
          daily_cost,
          hourly_cost,
          currency_rid,
        });

        if (resource_rid) {
          try {
            
            const sequelize = await initOrgSequelize();
            ResourceFiscal.initialize(sequelize,schemaName);
            // Check if a record already exists for this resource and fiscal year
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid: resource_rid,
              },
            });

            if (existingFiscal) {
              await existingFiscal.update({
                annual_cost,
                semiannual_cost:semi_annual_cost,
                monthly_cost,
                weekly_cost,
                bi_weekly_cost,
                daily_cost,
                hourly_cost,
                modified_datetime: new Date(),
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
          "",
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
      const sequelize = await initOrgSequelize();
      ResourceCostTimeline.initialize(sequelize,schemaName);
      // Create the timeline entry using Sequelize model
      await ResourceCostTimeline.create({
        account_rid: account_rid,
        event_name: eventName,
        event_status: eventStatus,
        entity_rid: resourceCost.rid || "",
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
  async updateResourceCost(resourceCostData: IUpdateResourceCost) {
    try {
      const repository = this.getResourceCostRepository();
      const {
        eid,
        effective_date,
        end_date,
        annual_cost,
        semi_annual_cost,
        monthly_cost,
        weekly_cost,
        bi_weekly_cost,
        daily_cost,
        hourly_cost,
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

      // Get the original resource cost before updating
      const originalResourceCost = await repository.findOne({
        where: { rid: rid },
      });

      if (!originalResourceCost) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Resource cost record not found",
        };
      }

      try {
        const [affectedCounts, affectedRows] = await repository.update(
          {
            eid,
            effective_date,
            end_date,
            annual_cost,
            semi_annual_cost,
            monthly_cost,
            weekly_cost,
            bi_weekly_cost,
            daily_cost,
            hourly_cost,
            currency_rid,
            rid,
            status,
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
            const sequelize = await initOrgSequelize();
            ResourceFiscal.initialize(sequelize,schemaName);
            // Check if a record already exists for this resource and fiscal year
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid: affectedRows[0].resource_rid,
              },
            });

            if (existingFiscal) {
              await existingFiscal.update({
                annual_cost,
                semiannual_cost:semi_annual_cost,
                monthly_cost,
                weekly_cost,
                bi_weekly_cost,
                daily_cost,
                hourly_cost,
                modified_datetime: new Date(),
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
            "",
            accountNumber
          );

          // Also log to timeline
          await this.createResourceCostTimeline(
            affectedRows[0],
            "Update",
            "Success",
            "",
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
      // Get the repository and sequelize instance
      const repository = this.getResourceCostRepository();
      const sequelize = repository.sequelize;
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
      const repository = this.getResourceCostRepository();
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

      const resourceCostById = await repository.findOne({
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
   * Determines the appropriate sort parameters for resource cost queries.
   * Validates the sort column and ensures the sort order is either ASC or DESC.
   * Falls back to default values if invalid parameters are provided.
   *
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @returns Tuple containing validated sort column and order
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "r_number",
      "resource_rid",
      "effective_date",
      "end_date",
    ];
    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
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
}

export default ResourceCostService;
