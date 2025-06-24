import { ResourceSkill } from "../models/resourceSkill";
import { IResourceSkill, IUpdateResourceSkill } from "../utils/types";
import { HttpStatus } from "../utils/constants";
import { ResourceSkillTimeline } from "../models/resourceSkillTimeline";
import { Skill } from "../models/skill";
import { ResourceSkillHistory } from "../models/resourceSkillHistory";
import resourceSkillSchemaService from "./resourceSkillSchemaService";
import SchemaService from "./schemaService";
import { ResourceFiscal } from "../models/resourceFiscal";
import { initOrgSequelize } from "../config/orgDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { initMainDbSequelize } from "../config/mainDataSource";
import moment from "moment";
import { Resources } from "../models/resource";

class ResourceSkillService {
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

  async createResourceSkill(
    resourceSkill: IResourceSkill,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any };
  }> {
    try {
      const {
        eid,
        account_rid,
        resource_type_rid,
        resource_rid,
        resource_code,
        effective_from,
        skill_description,
        skill_level_rid,
        created_by,
        modified_by,
        skill_type_rid,
        skill_subtype_rid,
        skill_type_others,
        skill_subtype_others,
        skill_details,
        accountNumber,
        comments,
        resource_number,
      } = resourceSkill;

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
         const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;

      
      // if (skill_type_rid && resource_rid) {
      //   const sequelizeInstance = await this.getOrgSequelize();
      //   console.log("Before Initialize");
      //   Resources.initialize(sequelizeInstance, schemaName);
      //   const ResourceModel = ResourceSkill.initialize(
      //     sequelizeInstance,
      //     schemaName
      //   );
      //   console.log("After Initialize");

      //   try {

      //       if(!skill_type_others){
      //       // Then check if this skill type rid exists for the resource
      //       const existingResourceSkill = await ResourceModel.findOne({
      //         where: {
      //           skill_type_rid: skill_type_rid,
      //           resource_rid,
      //         },
      //         attributes: ["rid"], // Only fetch the rid
      //       });

      //       if (existingResourceSkill) {
      //         return {
      //           statusCode: HttpStatus.FAILED,
      //           message: HttpStatus.FAILED_MESSAGE,
      //           errorMessage: `Skill already exists for this resource`,
      //         };
      //       }
      //     }
          
      //   } catch (error) {
      //     console.error("Error checking for duplicate skill:", error);
      //     // Continue with creation if check fails
      //   }
      
      // }
    

      // Create tables in parallel for better performance
      const [
        resourceSkillTableCreated,
        timelineTableCreated,
      ] = await Promise.all([
        resourceSkillSchemaService.createTablesInSchema(
          schemaName,
          "resource_skill"
        ),
        resourceSkillSchemaService.createTablesInSchema(
          schemaName,
          "resource_skill_timeline"
        ),
      ]);

      if (!resourceSkillTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Account schema or resource_skill table could not be created",
        };
      } else if (!timelineTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage:
            "Account schema or resource_skill_timeline table could not be created",
        };
      } 

      // Check if skill exists or create a new one
      // let skillRidToUse = skill_rid;

      // if (skill_name) {
      //   try {
      //     const sequelizeInstance = await this.getOrgSequelize();
      //     Skill.initialize(sequelizeInstance, schemaName);
      //     // Find existing skill by name
      //     const existingSkill = await Skill.findOne({
      //       where: {
      //         skill_name: skill_name,
      //       },
      //     });

      //     if (existingSkill) {
      //       // Use existing skill's RID
      //       skillRidToUse = existingSkill.rid;
      //     } else {
      //       // Create new skill if it doesn't exist
      //       const newSkill = await Skill.create({
      //         eid,
      //         skill_type,
      //         skill_name,
      //         skill_description,
      //         created_by: userId,
      //         modified_by: userId,
      //       });

      //       skillRidToUse = newSkill.rid;
      //     }
      //   } catch (skillError) {
      //     console.error("Error handling skill:", skillError);
      //     // Continue with the process even if skill handling fails
      //   }
      // }

      let createdResourceSkill;
      let eventStatus = "Success";
      let errorMessage = "";
      try {
        const sequelizeInstance = await this.getOrgSequelize();
        ResourceSkill.initialize(sequelizeInstance, schemaName);

        const startDate = this.formatDateForDb(effective_from as string);

        // Use the model's create method to leverage default values
        createdResourceSkill = await ResourceSkill.create({
          eid,
          account_rid,
          resource_type_rid,
          resource_rid,
          resource_number,
          resource_code,
          start_date: startDate || null,
          skill_description,
          skill_level_rid: skill_level_rid || "",
          skill_type_rid,
          skill_subtype_rid,
          skill_type_others,
          skill_subtype_others,
          comments,
          skill_details: skill_details || undefined,
          created_by: userId
        });

        // Update the resource_fiscal table
        if (resource_rid) {
          try {
            ResourceFiscal.initialize(sequelizeInstance, schemaName);
            // Check if a record already exists for this resource and fiscal year
            const existingFiscal = await ResourceFiscal.findOne({
              where: {
                resource_rid,
              },
            });

            if (existingFiscal) {
              await existingFiscal.update({
                modified_by: userId,
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
        await this.createResourceSkillTimeline(
          createdResourceSkill ? createdResourceSkill : {},
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
          resourceSkill: createdResourceSkill,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Creates a record in the ResourceSkillTimeline table using Sequelize ORM
   * @param resourceSkill - The created resource skill object
   * @param eventName - The event name (Create, Update, Delete)
   * @param eventStatus - The event status
   * @param modifiedBy - The user who performed the action
   * @param account_rid - The account RID
   * @param sequelize - The sequelize instance
   */
  async createResourceSkillTimeline(
    resourceSkill: any,
    eventName: string,
    eventStatus: string,
    modifiedBy: string,
    account_rid: string,
    schemaName: string
  ): Promise<void> {
    try {
      const sequelizeInstance = await this.getOrgSequelize();
      ResourceSkillTimeline.initialize(sequelizeInstance, schemaName);
      // Create the timeline entry using Sequelize model
      await ResourceSkillTimeline.create({
        account_rid: account_rid,
        event_name: eventName,
        event_status: eventStatus,
        entity_rid: resourceSkill.rid || "",
        created_by: modifiedBy,
      });
    } catch (error) {
      console.error("Failed to create timeline entry:", error);
      throw error;
    }
  }

  /**
   * Updates an existing resource skill record in the specified account schema.
   *
   * This method:
   * 1. Validates the schema exists
   * 2. Sets the correct schema context
   * 3. Updates the resource skill record with the provided data
   *
   * @param resourceSkillData - Object containing updated resource skill details and identifiers
   * @returns Promise resolving to status object with updated resource skill data or error message
   */
  async updateResourceSkill(
    resourceSkillData: IUpdateResourceSkill,
    userId: string
  ) {
    try {
      const {
        rid,
        eid,
        effective_from,
        skill_description,
        skill_level_rid,
        skill_type_rid,
        skill_subtype_rid,
        skill_type_others,
        skill_subtype_others,
        skill_details,
        comments,
        modified_by,
        status_rid,
        accountNumber,
      } = resourceSkillData;

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;

      // Create tables in parallel for better performance
      const [timelineTableCreated, historyTableCreated] = await Promise.all([
        resourceSkillSchemaService.createTablesInSchema(
          schemaName,
          "resource_skill_timeline"
        ),
        resourceSkillSchemaService.createTablesInSchema(
          schemaName,
          "resource_skill_history"
        ),
      ]);

      if (!timelineTableCreated || !historyTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Failed to create required tables in account schema",
        };
      }

      const sequelizeInstance = await this.getOrgSequelize();

      ResourceSkill.initialize(sequelizeInstance, schemaName);
      // Get the original resource skill before updating
      const originalResourceSkill = await ResourceSkill.findOne({
        where: { rid: rid },
      });

      if (!originalResourceSkill) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Resource skill record not found",
        };
      }

      // Handle skill_name update if provided
      // let skillRidToUse = originalResourceSkill.skill_rid;

      // if (skill_name) {
      //   try {
      //     Skill.initialize(sequelizeInstance, schemaName);

      //     // Find existing skill by name
      //     const existingSkill = await Skill.findOne({
      //       where: {
      //         skill_name: skill_name,
      //       },
      //     });

      //     if (existingSkill) {
      //       // Use existing skill's RID
      //       skillRidToUse = existingSkill.rid;
      //     } else {
      //       // Create new skill if it doesn't exist
      //       const newSkill = await Skill.create({
      //         eid,
      //         skill_type: resourceSkillData.skill_type || "",
      //         skill_name,
      //         skill_description,
      //         created_by: userId,
      //         modified_by: userId,
      //       });

      //       skillRidToUse = newSkill.rid;
      //     }
      //   } catch (skillError) {
      //     console.error("Error handling skill:", skillError);
      //     return {
      //       statusCode: HttpStatus.FAILED,
      //       message: HttpStatus.FAILED_MESSAGE,
      //       errorMessage:
      //         "Failed to process skill information: " +
      //         (skillError as Error).message,
      //     };
      //   }
      // }

      try {

        const startDate = this.formatDateForDb(effective_from as string);
        const [affectedCounts, affectedRows] = await ResourceSkill.update(
          {
            rid,
            eid,
            start_date: startDate || null,
            skill_description,
            skill_level_rid,
            skill_type_rid,
            skill_subtype_rid,
            skill_type_others,
            skill_subtype_others,
            comments,
            skill_details: skill_details || undefined,
            status_rid,
            modified_by: userId,
            modified_datetime: new Date(),
          },
          {
            where: {
              rid: rid,
            },
            returning: true,
          }
        );
        // Create history records for the changes
        if (affectedCounts > 0) {
          await this.createResourceSkillHistory(
            originalResourceSkill.toJSON(),
            affectedRows[0],
            userId,
            accountNumberFetched
          );

          // Also log to timeline
          await this.createResourceSkillTimeline(
            affectedRows[0],
            "Update",
            "Success",
            userId,
            originalResourceSkill.account_rid,
            schemaName
          );
        }

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            affectedCounts,
            resourceSkill: affectedRows[0],
          },
        };
      } catch (err) {
        // Log the failed update to timeline
        try {
          await this.createResourceSkillTimeline(
            originalResourceSkill,
            "Update",
            "Failed",
            userId,
            originalResourceSkill.account_rid,
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
   * Creates history records for changed attributes in resource skill records.
   * @param oldResourceSkill - The original resource skill object before changes
   * @param newResourceSkill - The updated resource skill object after changes
   * @param modifiedBy - The user who performed the action
   */
  private async createResourceSkillHistory(
    oldResourceSkill: any,
    newResourceSkill: any,
    modifiedBy: string,
    accountNumber: string
  ): Promise<void> {
    try {
      // Make sure we're in the right schema context
      const schemaName = `trd365_${accountNumber.replace(/\D/g, '')}`;
      const validatedSchema = await resourceSkillSchemaService.validateSchema(
        schemaName,
        "resource_skill_history"
      );
      if (!validatedSchema) {
        throw new Error("Invalid or missing schema");
      }

      // Define the attributes to track changes for
      const trackedAttributes = [
        "eid",
        "start_date",
        "skill_description",
        "skill_level_rid",
        "skill_type_rid",
        "skill_subtype_rid",
        "skill_type_others",
        "skill_subtype_others",
        "comments",
        "skill_details",
        "fiscal_year",
        "modified_by",
        "status",
      ];

      // Track changes for each attribute individually to better isolate errors
      for (const attribute of trackedAttributes) {
        try {
          const oldValue = oldResourceSkill[attribute];
          const newValue = newResourceSkill[attribute];

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

            const sequelizeInstance = await this.getOrgSequelize();
            ResourceSkillHistory.initialize(sequelizeInstance, schemaName);
            // Create individual record to isolate errors
            await ResourceSkillHistory.create({
              resource_skill_rid: newResourceSkill.rid,
              attribute_name: attribute,
              old_value:
                formattedOldValue !== undefined
                  ? String(formattedOldValue)
                  : "",
              new_value:
                formattedNewValue !== undefined
                  ? String(formattedNewValue)
                  : "",
              created_by: modifiedBy
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
   * Retrieves a paginated list of resource skills for a specific account and fiscal year.
   * Supports filtering, sorting, and searching functionality.
   *
   * @param rid - Optional specific resource skill RID to retrieve
   * @param page - Page number for pagination
   * @param limit - Number of records per page
   * @param search - Search term to filter results
   * @param filters - Object containing filter criteria
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @param accountNumber - Account identifier for schema selection
   * @param fiscalYear - Fiscal year to filter results
   * @returns Promise with status code and resource skill data or error message
   */
  async resourceSkillList(
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
    data?: { resourceSkill: any; count: number };
  }> {
    try {
      const offset = (page - 1) * limit;
      const [finalSortBy, finalSortOrder] =
        resourceSkillSchemaService.getSortParameters(sortBy, sortOrder);

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Check if account-specific schema exists
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableName = "resource_skill";
      const schemaAndTableValidation =
        await resourceSkillSchemaService.validateSchema(
          accountNumberFetched,
          tableName
        );

      if (!schemaAndTableValidation) {
        return resourceSkillSchemaService.createErrorResponse(
          "Account schema does not exist"
        );
      }

      // Build query components
      const searchCondition =
        resourceSkillSchemaService.buildSearchCondition(search);
      let filterConditions = resourceSkillSchemaService.buildFilterConditions(
        filters,
        fiscalYear
      );

      // Execute queries and return results using the schema service
      return await resourceSkillSchemaService.executeQueries(
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
   * Retrieves a  list of resource skills for a specific account and fiscal year for excel download.
   * Supports filtering, sorting, and searching functionality.
   *
   * @param rid - Optional specific resource skill RID to retrieve
   * @param search - Search term to filter results
   * @param filters - Object containing filter criteria
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @param accountNumber - Account identifier for schema selection
   * @param fiscalYear - Fiscal year to filter results
   * @returns Promise with status code and resource skill data or error message
   */
  async exportResourceSkillList(
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
    data?: { resourceSkill: any; };
  }> {
    try {
      const [finalSortBy, finalSortOrder] =
        resourceSkillSchemaService.getSortParameters(sortBy, sortOrder);

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Check if account-specific schema exists
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const tableName = "resource_skill";
      const schemaAndTableValidation =
        await resourceSkillSchemaService.validateSchema(
          accountNumberFetched,
          tableName
        );

      if (!schemaAndTableValidation) {
        return resourceSkillSchemaService.createErrorResponse(
          "Account schema does not exist"
        );
      }

      // Build query components
      const searchCondition =
        resourceSkillSchemaService.buildSearchCondition(search);
      let filterConditions = resourceSkillSchemaService.buildFilterConditions(
        filters,
        fiscalYear
      );

      // Execute queries and return results using the schema service
      return await resourceSkillSchemaService.exportResoucreSkill(
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
   * Retrieves a specific resource skill record by ID from the specified account schema.
   * Includes the associated Resource skill record in the result.
   *
   * @param id - Unique identifier of the resource skill record
   * @param accountNumber - Account identifier for schema selection
   * @returns Promise resolving to status object with resource skill data or error message
   */
  async resourceSkillById(id: string, accountNumber: string) {
    try {
      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      const schemaName = `trd365_${accountNumberFetched.replace(/\D/g, '')}`;
      const validateSchema = await resourceSkillSchemaService.validateSchema(
        schemaName,
        "resource_skill"
      );

      if (!validateSchema) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Account schema does not exist",
        };
      }

      const sequelize = await this.getOrgSequelize();
      ResourceSkill.initialize(sequelize, schemaName);
      const resourceSkillById = await ResourceSkill.findOne({
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

      // Fetch user names for created_by and modified_by
      const userNames = await this.fetchUserNames({
        created_by: resourceSkillById?.created_by,
        modified_by: resourceSkillById?.modified_by,
      });

      if (resourceSkillById) {
        resourceSkillById.created_by = userNames.created_by_name;
        resourceSkillById.modified_by = userNames.modified_by_name;
      }

      const resourceInfo = (resourceSkillById as any).Resource;

      if (resourceInfo) {
        // Safely format dates with null checks and validation
        if (resourceInfo.resource_startdate) {
          const startDate = moment(resourceInfo.resource_startdate);
          if (startDate.isValid()) {
            resourceInfo.dataValues.resource_startdate = startDate.format('YYYY-MM-DD') as any;
          }
        }
        
        if (resourceInfo.resource_enddate) {
          const endDate = moment(resourceInfo.resource_enddate);
          if (endDate.isValid()) {
            resourceInfo.dataValues.resource_enddate = endDate.format('YYYY-MM-DD') as any;
          }
        }
      }

      // Get the main database connection
    const mainDbSequelize = await this.getMainDbSequelize();

    // Fetch skill type name
    const skillTypeQuery = `SELECT skill_type_name FROM "public"."skill_type" WHERE rid = :skillTypeRid`;
    const skillType = await mainDbSequelize.query(skillTypeQuery, {
      replacements: { skillTypeRid: resourceSkillById?.skill_type_rid },
      type: "SELECT",
      plain: true
    });

    // Fetch skill subtype name
    const skillSubtypeQuery = `SELECT skill_subtype_name FROM "public"."skill_subtype" WHERE rid = :skillSubtypeRid`;
    const skillSubtype = await mainDbSequelize.query(skillSubtypeQuery, {
      replacements: { skillSubtypeRid: resourceSkillById?.skill_subtype_rid },
      type: "SELECT",
      plain: true
    });

    if (resourceSkillById && resourceSkillById.dataValues) {
      resourceSkillById.dataValues = {
        ...resourceSkillById.dataValues,
        skill_type_name: skillType?.skill_type_name?.toString() || '',
        skill_subtype_name: skillSubtype?.skill_subtype_name?.toString() || ''
      };
    }

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceSkillById,
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
   * @param dateString Date string in yyyy-mm-dd format
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

  async getSkillTypes(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { skillTypes: any[]};
  }> {
    try {
      const mainDbSequelize = await this.getMainDbSequelize();
      
      const skillTypes = await mainDbSequelize.query(
        `SELECT 
          rid,
          skill_type_name,
          skill_type_description,
          status,
          created_by,
          modified_by,
          created_datetime,
          modified_datetime
        FROM skill_type 
        WHERE status = 'active'
        ORDER BY skill_type_name ASC`,
        {
          type: QueryTypes.SELECT
        }
      );

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          skillTypes
        }
      };

    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async getSkillSubTypes(skillTypeRids: string[] | string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { skillSubTypes: any[] };
  }> {
    try {
      const mainDbSequelize = await this.getMainDbSequelize();
      const skillSubTypes = await mainDbSequelize.query(
        `SELECT
          rid,
          skill_type_rid,
          skill_subtype_name,
          skill_subtype_description,
          status,
          created_by,
          modified_by,
          created_datetime,
          modified_datetime
        FROM skill_subtype
        WHERE skill_type_rid IN (:skillTypeRids) AND status = 'active'
        ORDER BY skill_subtype_name ASC`,
        {
          replacements: { skillTypeRids },
          type: QueryTypes.SELECT
        }
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          skillSubTypes
        }
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }
}

export default ResourceSkillService;
