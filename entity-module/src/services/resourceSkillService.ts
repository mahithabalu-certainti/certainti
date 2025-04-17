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




class ResourceSkillService {
    private resourceSkillRepository: typeof ResourceSkill | null;
    private schemaService: SchemaService;

    constructor(){
        this.resourceSkillRepository=null;
        this.schemaService = new SchemaService();
    }




    private getResourceSkillRepository(): typeof ResourceSkill {
        if(!this.resourceSkillRepository){
            this.resourceSkillRepository = ResourceSkill;
        }
        return this.resourceSkillRepository;
    }


    async createResourceSkill(resourceSkill: IResourceSkill): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: { resourceSkill: any };
      }> {
        try {
          const repository = this.getResourceSkillRepository();
          const {
            eid,
            account_rid,
            resource_type,
            resource_rid,
            resource_ref_id,
            resource_desc,
            skill_rid,
            start_date,
            skill_description,
            skill_level,
            years_of_experience,
            created_by,
            modified_by,
            skill_type,
            skill_name,
            technical_weightage,
            accountNumber,
          } = resourceSkill;
      
          let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
          const schemaName = `platform_v2_${accountNumberFetched}`;
          
          // Create both tables in parallel for better performance
          const [resourceSkillTableCreated, timelineTableCreated, skillTableCreated] = await Promise.all([
            resourceSkillSchemaService.createTablesInSchema(schemaName, "resource_skill"),
            resourceSkillSchemaService.createTablesInSchema(schemaName, "resource_skill_timeline"),
            resourceSkillSchemaService.createTablesInSchema(schemaName, "skill"),
          ]);
      
          if (!resourceSkillTableCreated) {
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: "Account schema or resource_skill table could not be created",
            };
          }
      
          else if(!timelineTableCreated){
             return {
               statusCode: HttpStatus.FAILED,
               message: HttpStatus.FAILED_MESSAGE,
               errorMessage: "Account schema or resource_skill_timeline table could not be created",
             }
          }
      
          else if(!skillTableCreated){
            return {
              statusCode: HttpStatus.FAILED,
              message: HttpStatus.FAILED_MESSAGE,
              errorMessage: "Account schema or skill table could not be created",
            }
         }
          
          // Check if skill exists or create a new one
          let skillRidToUse = skill_rid;
          
          if (skill_name) {
            try {
              
              // Find existing skill by name
              const existingSkill = await Skill.findOne({
                where: {
                  skill_name: skill_name
                }
              });
              
              if (existingSkill) {
                // Use existing skill's RID
                skillRidToUse = existingSkill.rid;
              } else{
                // Create new skill if it doesn't exist
                const newSkill = await Skill.create({
                  eid,
                  skill_type,
                  skill_name,
                  skill_description,
                  created_by,
                  modified_by
                });
                
                skillRidToUse = newSkill.rid;
              }
            } catch (skillError) {
              console.error("Error handling skill:", skillError);
              // Continue with the process even if skill handling fails
            }
          }
          
          let createdResourceSkill;
          let eventStatus = "Success";
          let errorMessage = "";
          
          try {
            // Use the model's create method to leverage default values
            createdResourceSkill = await repository.create({
              eid,
              account_rid,
              resource_type,
              resource_rid,
              resource_ref_id,
              resource_desc,
              skill_rid: skillRidToUse, // Use the determined skill RID
              start_date,
              skill_description,
              skill_level,
              years_of_experience,
              created_by,
              modified_by,
              technical_weightage,
            });

            // Update the resource_fiscal table
      if (resource_rid) {
        try {
          const sequelize = await initOrgSequelize();
          ResourceFiscal.initialize(sequelize,schemaName);
          // Check if a record already exists for this resource and fiscal year
          const existingFiscal = await ResourceFiscal.findOne({
            where: {
              resource_rid,
            }
          });
          
          if (existingFiscal) {
            await existingFiscal.update({
              modified_by,
              modified_datetime: new Date()
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
    schemaName: string,
  ): Promise<void> {
    try {
      
      const sequelize = await initOrgSequelize();
      ResourceSkillTimeline.initialize(sequelize,schemaName);
      // Create the timeline entry using Sequelize model
      await ResourceSkillTimeline.create({
        account_rid: account_rid,
        event_name: eventName,
        event_status: eventStatus,
        entity_rid: resourceSkill.rid || "",
        modified_by: modifiedBy,
        
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
  async updateResourceSkill(resourceSkillData: IUpdateResourceSkill) {
    try {
      const repository = this.getResourceSkillRepository();
      const {
        rid,
        eid, 
        start_date,
        skill_description,
        skill_level,
        years_of_experience,
        modified_by,
        status,
        technical_weightage,
        accountNumber,
      } = resourceSkillData;


    let { accountNumber: accountNumberFetched, accountId } =
      await this.schemaService.fetchAccountByNumber(accountNumber);  
    const schemaName = `platform_v2_${accountNumberFetched}`;

    // Create tables in parallel for better performance
    const [timelineTableCreated, historyTableCreated] = await Promise.all([
      resourceSkillSchemaService.createTablesInSchema(schemaName, "resource_skill_timeline"),
      resourceSkillSchemaService.createTablesInSchema(schemaName, "resource_skill_history")
    ]);

    if (!timelineTableCreated || !historyTableCreated) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Failed to create required tables in account schema",
      };
    }

    // Get the original resource skill before updating
    const originalResourceSkill = await repository.findOne({
      where: { rid: rid }
    });

    if (!originalResourceSkill) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Resource skill record not found",
      };
    }

      try{
      const [affectedCounts, affectedRows] = await repository.update(
        {
          rid,
          eid, 
          start_date,
          skill_description,
          skill_level,
          skill_rid:originalResourceSkill.skill_rid,
          status,
          years_of_experience,
          modified_by,
          technical_weightage,
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
        "",
        accountNumberFetched
      );

      // Also log to timeline
      await this.createResourceSkillTimeline(
        affectedRows[0],
        "Update",
        "Success",
        "",
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
          "",
          originalResourceSkill.account_rid,
          schemaName
        );
      } catch (timelineError) {
        console.error("Failed to create timeline entry for failed update:", timelineError);
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
  accountNumber: string,
): Promise<void> {
  try {
    // Get the repository and sequelize instance
    const repository = this.getResourceSkillRepository();

    // Make sure we're in the right schema context
    const schemaName = `platform_v2_${accountNumber}`;
    const validatedSchema = await resourceSkillSchemaService.validateSchema(schemaName,"resource_skill_history");
    if (!validatedSchema) {
      throw new Error("Invalid or missing schema");
    }
    
    // Define the attributes to track changes for
    const trackedAttributes = [
        'eid', 
        'start_date',
        'skill_description',
        'skill_level',
        'years_of_experience',
        'fiscal_year',
        'modified_by',
        'technical_weightage',
        'status',
    ];
    
    // Track changes for each attribute individually to better isolate errors
    for (const attribute of trackedAttributes) {
      try {
        const oldValue = oldResourceSkill[attribute];
        const newValue = newResourceSkill[attribute];
        
        // Only create history record if the value has changed
        if (oldValue !== newValue && (oldValue !== undefined || newValue !== undefined)) {
          // Format date values properly
          let formattedOldValue = oldValue;
          let formattedNewValue = newValue;
          
          if (attribute === 'effective_date' || attribute === 'end_date') {
            if (oldValue) formattedOldValue = new Date(oldValue).toISOString().split('T')[0];
            if (newValue) formattedNewValue = new Date(newValue).toISOString().split('T')[0];
          }
          
          // Create individual record to isolate errors
          await ResourceSkillHistory.create({
            resource_skill_rid: newResourceSkill.rid,
            attribute_name: attribute,
            old_value: formattedOldValue !== undefined ? String(formattedOldValue) : "",
            new_value: formattedNewValue !== undefined ? String(formattedNewValue) : "",
            modified_by: modifiedBy,
          });
        }
      } catch (attrError) {
        console.error(`Error creating history for attribute ${attribute}:`, attrError);
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
    rid: string,
    page: number,
    limit: number,
    search: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: string,
    accountNumber: string,
    fiscalYear: number
  )
  : Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { resourceSkill: any; count: number };
  }> 
  {
    try {
      const repository = this.getResourceSkillRepository();
      const offset = (page - 1) * limit;
      const [finalSortBy, finalSortOrder] = resourceSkillSchemaService.getSortParameters(sortBy, sortOrder);

      let { accountNumber: accountNumberFetched, accountId } =
        await this.schemaService.fetchAccountByNumber(accountNumber);
      // Check if account-specific schema exists
      const schemaName = `platform_v2_${accountNumberFetched}`;
      const tableName = "resource_skill";
      const schemaAndTableValidation = await resourceSkillSchemaService.validateSchema(accountNumberFetched, tableName);

      if (!schemaAndTableValidation) {
        return resourceSkillSchemaService.createErrorResponse("Account schema does not exist");
      }

      // If rid is provided, we can optimize by directly querying for that specific record
      if (rid) {
        
        // Direct query for the specific resource skill by rid
        const query = `
          SELECT 
            rs.*,
            s.skill_name,
            row_to_json(r) AS resource_data
          FROM "${schemaName}"."resource_skill" rs
          INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
          INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
          WHERE rs.rid = :rid
        `;

        const results = await repository.sequelize?.query(query, {
          replacements: { rid },
          type: "SELECT",
        });

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            resourceSkill: results,
            count: results?.length || 0,
          },
        };
      }

      // Build query components
      const searchCondition = resourceSkillSchemaService.buildSearchCondition(search);
      let filterConditions = resourceSkillSchemaService.buildFilterConditions(filters, fiscalYear);

      // Execute queries and return results using the schema service
      return await resourceSkillSchemaService.executeQueries(
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

}

export default ResourceSkillService;