import { ResourceSkill } from "../models/resourceSkill";
import { IResourceSkill, IUpdateResourceSkill } from "../utils/types";
import { createTablesInSchema } from "../models";
import { HttpStatus } from "../utils/constants";
import { ResourceSkillTimeline } from "../models/resourceSkillTimeline";
import { Skill } from "../models/skill";
import { ResourceSkillHistory } from "../models/resourceSkillHistory";




class ResourceSkillService {
    private resourceSkillRepository: typeof ResourceSkill | null;

    constructor(){
        this.resourceSkillRepository=null;
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
      
          const schemaName = `platform_v2_${accountNumber}`;
          
          // Create both tables in parallel for better performance
          const [resourceSkillTableCreated, timelineTableCreated, skillTableCreated] = await Promise.all([
            createTablesInSchema(schemaName, "resource_skill"),
            createTablesInSchema(schemaName, "resource_skill_timeline"),
            createTablesInSchema(schemaName, "skill"),
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
      
          const sequelize = repository.sequelize;
          if (!sequelize) {
            throw new Error("Database connection not available");
          }
      
          // Set the schema for this connection
          await sequelize.query(`SET search_path To "${schemaName}"`);
          
          // Check if skill exists or create a new one
          let skillRidToUse = skill_rid;
          
          if (skill_name) {
            try {
              // Initialize the Skill model with the current sequelize instance
              Skill.initialize(sequelize);
              
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
  ): Promise<void> {
    try {
      
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


    const schemaName = `platform_v2_${accountNumber}`;

    // Create tables in parallel for better performance
    const [timelineTableCreated, historyTableCreated] = await Promise.all([
      createTablesInSchema(schemaName, "resource_skill_timeline"),
      createTablesInSchema(schemaName, "resource_skill_history")
    ]);

    if (!timelineTableCreated || !historyTableCreated) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Failed to create required tables in account schema",
      };
    }

    const sequelize = repository.sequelize;
    if (!sequelize) {
      throw new Error("Database connection not available");
    }

    // Set the schema for this connection
    await sequelize.query(`SET search_path To "${schemaName}"`);

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
        accountNumber
      );

      // Also log to timeline
      await this.createResourceSkillTimeline(
        affectedRows[0],
        "Update",
        "Success",
        "",
        originalResourceSkill.account_rid,
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
        console.log("line 353");
        await this.createResourceSkillTimeline(
          originalResourceSkill,
          "Update",
          "Failed",
          "",
          originalResourceSkill.account_rid,
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
    const sequelize = repository.sequelize;
    if (!sequelize) {
      throw new Error("Database connection not available");
    }

    // Make sure we're in the right schema context
    const schemaName = `platform_v2_${accountNumber}`;
    // Verify the table exists in the schema
    const tableExists = await createTablesInSchema(schemaName, "resource_skill_history");
    if (!tableExists) {
      throw new Error(`Table resource_skill_history does not exist in schema ${schemaName}`);
    }
    
    // Set the schema context explicitly
    await sequelize.query(`SET search_path TO "${schemaName}"`);

    // Make sure ResourceSkillHistory is initialized
    if (ResourceSkillHistory.sequelize) {
      ResourceSkillHistory.initialize(ResourceSkillHistory.sequelize);
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
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);

      // Check if account-specific schema exists
      const schemaName = `platform_v2_${accountNumber}`;
      const tableName = "resource_skill";
      const schemaAndTableValidation = await createTablesInSchema(schemaName, tableName);

      if (!schemaAndTableValidation) {
        return this.createErrorResponse("Account schema does not exist");
      }

      // Query from account-specific schema
      const sequelize = repository.sequelize;
      if (!sequelize) {
        throw new Error("Database connection not available");
      }

      // If rid is provided, we can optimize by directly querying for that specific record
      if (rid) {
        // Set the schema for this connection
        await sequelize.query(`SET search_path To "${schemaName}"`);
        
        // Direct query for the specific resource skill by rid
        const query = `
          SELECT 
            rs.*,
            s.skill_name,
            json_build_object(
              'rid', r.rid,
              'resource_ref_id', r.resource_ref_id,
              'resource_type', r.resource_type,
              'first_name', r.resource_first_name,
              'last_name', r.resource_last_name,
              'full_name', r.resource_full_name,
              'email', r.resource_email,
              'role', r.resource_role
            ) AS resource_data
          FROM "${schemaName}"."resource_skill" rs
          INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
          INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
          WHERE rs.rid = :rid
        `;

        const results = await sequelize.query(query, {
          replacements: { rid },
          type: "SELECT",
        });

        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: {
            resourceSkill: results,
            count: results.length,
          },
        };
      }

      // Build query components
      const searchCondition = this.buildSearchCondition(search);
      let filterConditions = this.buildFilterConditions(filters, fiscalYear);

      // Execute queries and return results
      return await this.executeQueries(
        sequelize,
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
 * Process enum field filters for raw SQL query
 * @param key - The field name
 * @param value - The filter value object
 * @returns SQL condition string
 */
private processEnumFilter(key: string, value: any): string {
  let condition = "";
  let tableAlias = "";
  // Determine the table alias based on the field
  if(key === "resource_type"){
     tableAlias = "r"; 
  } else if(key === "skill_level") {
     tableAlias = "rs";
  }
  
  if (value.equals !== undefined) {
    condition += ` AND ${tableAlias}."${key}" = '${value.equals}'`;
  } else if (value.not_equals !== undefined) {
    condition += ` AND ${tableAlias}."${key}" != '${value.not_equals}'`;
  } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    const values = value.in.map((item: string) => `'${item}'`).join(",");
    condition += ` AND ${tableAlias}."${key}" IN (${values})`;
  } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
    const values = value.not_in.map((item: string) => `'${item}'`).join(",");
    condition += ` AND ${tableAlias}."${key}" NOT IN (${values})`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND (${tableAlias}."${key}" IS NULL OR ${tableAlias}."${key}" = '')`;
    }
  } else if (value.is_not_empty !== undefined) {
    if (value.is_not_empty) {
      condition += ` AND ${tableAlias}."${key}" IS NOT NULL AND ${tableAlias}."${key}" != ''`;
    }
  }
  
  return condition;
}


  /**
     * Builds the search condition for the SQL query
     * 
     * @param search - The search term
     * @returns SQL fragment for search condition
     */
  private buildSearchCondition(search: string): string {
    if (!search) return "";
    
    return `
      AND (
        rs.skill_name ILIKE :searchTerm 
        OR r.resource_full_name ILIKE :searchTerm
      )
    `;
  }

  /**
   * Builds filter conditions including fiscal year filter
   * 
   * @param filters - The filters object
   * @param fiscalYear - The fiscal year to filter by
   * @returns SQL fragment for filter conditions
   */
  private buildFilterConditions(filters: Record<string, any>, fiscalYear: number): string {
    let filterConditions = "";
    
    if (filters && Object.keys(filters).length > 0) {
      filterConditions = this.processFiltersForRawQuery(filters);
    }

    const fiscalYearCondition = `
      AND r.fiscal_year = ${fiscalYear}`;

    // Add fiscal year condition to filter conditions
    filterConditions += fiscalYearCondition;
    
    return filterConditions;
  }

  /**
   * Executes the main and count queries and formats the response
   * 
   * @param sequelize - The Sequelize instance
   * @param schemaName - The schema name
   * @param filterConditions - SQL filter conditions
   * @param searchCondition - SQL search condition
   * @param finalSortBy - Field to sort by
   * @param finalSortOrder - Sort order (ASC/DESC)
   * @param limit - Number of records per page
   * @param offset - Offset for pagination
   * @param search - Search term
   * @returns Promise with query results
   */
  private async executeQueries(
    sequelize: any,
    schemaName: string,
    filterConditions: string,
    searchCondition: string,
    finalSortBy: string,
    finalSortOrder: string,
    limit: number,
    offset: number,
    search: string
  ) {
    // Build the query to get data from the account-specific schema
    const query = `
      SELECT rs.*, r.resource_number, r.resource_full_name, s.skill_name
      FROM "${schemaName}"."resource_skill" rs
      INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
      INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
      WHERE 1=1
      ${filterConditions}
      ${searchCondition}
      ORDER BY rs."${finalSortBy}" ${finalSortOrder}
      LIMIT :limit OFFSET :offset
    `;

    // Count query to get total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "${schemaName}"."resource_skill" rs
      INNER JOIN "${schemaName}"."resources" r ON rs.resource_rid = r.rid
      INNER JOIN "${schemaName}"."skill" s ON rs.skill_rid = s.rid
      WHERE 1=1
      ${filterConditions}
      ${searchCondition}
    `;

    const replacements = {
      limit,
      offset,
      searchTerm: search ? `%${search}%` : null,
    };

    // Execute the queries
    const [results, countResult] = await Promise.all([
      sequelize.query(query, {
        replacements,
        type: "SELECT",
      }),
      sequelize.query(countQuery, {
        replacements,
        type: "SELECT",
        plain: true,
      }),
    ]);

    const resourceSkill = results;
    const totalCount = countResult ? (countResult as any).total : 0;

    return {
      statusCode: HttpStatus.SUCCESS,
      message: HttpStatus.SUCCESS_MESSAGE,
      data: {
        resourceSkill: resourceSkill,
        count: parseInt(totalCount, 10),
      },
    };
  }

/**
 * Process filters for raw SQL query by converting filter object to SQL WHERE conditions.
 * Handles different types of filters (alphanumeric, numeric, date) with various operators.
 *
 * @param filters - The filters object from the request
 * @returns string - SQL WHERE clause fragment for filters
 */
private processFiltersForRawQuery(filters: Record<string, any>): string {
  let filterConditions = "";

  // Define field types for proper filter handling
  const alphanumericFields = ["skill_name"];
  const numericFields = [
    "years_of_experience",
  ];
  const dateFields = ["start_date"];
  const enumFields = ["resource_type", "skill_level"];

  // Process each filter
  Object.entries(filters).forEach(([key, value]) => {
    
    // Handle different filter types based on field type
    if (typeof value === "object") {
      if (alphanumericFields.includes(key)) {
        filterConditions += this.processAlphanumericFilter(key, value);
      } else if (numericFields.includes(key)) {
        filterConditions += this.processNumericFilter(key, value);
      } else if (dateFields.includes(key)) {
        filterConditions += this.processDateFilter(key, value);
      } else if (enumFields.includes(key)){
        filterConditions += this.processEnumFilter(key, value);
      } 
      else {
        filterConditions += this.processDefaultFilter(key, value);
      }
    } else if (value !== undefined && value !== null) {
      // Simple equality
      filterConditions += this.processSimpleEqualityFilter(key, value);
    }
  });


  return filterConditions;
}

/**
 * Process alphanumeric field filters
 * @param key - The field name
 * @param value - The filter value object
 * @returns SQL condition string
 */
private processAlphanumericFilter(key: string, value: any): string {
  let condition = "";
  
  if (value.equals) {
    condition += ` AND s."${key}" = '${value.equals}'`;
  } else if (value.not_equals) {
    condition += ` AND s."${key}" != '${value.not_equals}'`;
  } else if (value.contains) {
    condition += ` AND s."${key}" ILIKE '%${value.contains}%'`;
  } else if (value.not_contains) {
    condition += ` AND s."${key}" NOT ILIKE '%${value.not_contains}%'`;
  } else if (value.starts_with) {
    condition += ` AND s."${key}" ILIKE '${value.starts_with}%'`;
  } else if (value.ends_with) {
    condition += ` AND s."${key}" ILIKE '%${value.ends_with}'`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND (s."${key}" IS NULL OR s."${key}" = '')`;
    } 
  }
  else if (value.is_not_empty !== undefined) {
   if(value.is_not_empty) {
    condition += ` AND s."${key}" IS NOT NULL AND s."${key}" != ''`;
   }      
  } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    const values = value.in.map((item: string) => `'${item}'`).join(",");
    condition += ` AND s."${key}" IN (${values})`;
  } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
    const values = value.not_in.map((item: string) => `'${item}'`).join(",");
    condition += ` AND s."${key}" NOT IN (${values})`;
  }
  
  return condition;
}

/**
 * Process numeric field filters
 * @param key - The field name
 * @param value - The filter value object
 * @returns SQL condition string
 */
private processNumericFilter(key: string, value: any): string {
  let condition = "";
  
  if (value.equals !== undefined) {
    condition += ` AND rs."${key}" = ${value.equals}`;
  } else if (value.not_equals !== undefined) {
    condition += ` AND rs."${key}" != ${value.not_equals}`;
  } else if (value.greater_than !== undefined) {
    condition += ` AND rs."${key}" > ${value.greater_than}`;
  } else if (value.less_Than !== undefined) {
    condition += ` AND rs."${key}" < ${value.less_than}`;
  } else if (value.between && Array.isArray(value.between) && value.between.length === 2) {
    condition += ` AND rs."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND rs."${key}" IS NULL`;
    } 
  }
  else if (value.is_not_empty !== undefined) {
    if (value.is_not_empty) {
      condition += ` AND rs."${key}" IS NOT NULL`;
    }
  }
  else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
    const values = value.in.join(",");
    condition += ` AND rs."${key}" IN (${values})`;
  } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
    const values = value.not_in.join(",");
    condition += ` AND rs."${key}" NOT IN (${values})`;
  }
  
  return condition;
}

/**
 * Process date field filters
 * @param key - The field name
 * @param value - The filter value object
 * @returns SQL condition string
 */
private processDateFilter(key: string, value: any): string {
  let condition = "";
  
  if (value.equals) {
    condition += ` AND rs."${key}"::date = '${value.equals}'::date`;
  } else if (value.not_equals) {
    condition += ` AND rs."${key}"::date != '${value.not_equals}'::date`;
  } else if (value.before) {
    condition += ` AND rs."${key}" < '${value.before}'`;
  } else if (value.after) {
    condition += ` AND rs."${key}" > '${value.after}'`;
  } else if (value.between && Array.isArray(value.between) && value.between.length === 2) {
    condition += ` AND rs."${key}" BETWEEN '${value.between[0]}' AND '${value.between[1]}'`;
  } else if (value.this_week) {
    condition += ` AND rs."${key}" BETWEEN 
      date_trunc('week', CURRENT_DATE) AND 
      (date_trunc('week', CURRENT_DATE) + interval '6 days')`;
  } else if (value.this_month) {
    condition += ` AND rs."${key}" BETWEEN 
      date_trunc('month', CURRENT_DATE) AND 
      (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')`;
  } else if (value.this_quarter) {
    condition += ` AND rs."${key}" BETWEEN 
      date_trunc('quarter', CURRENT_DATE) AND 
      (date_trunc('quarter', CURRENT_DATE) + interval '3 months - 1 day')`;
  } else if (value.last_7_days) {
    condition += ` AND rs."${key}" BETWEEN 
      (CURRENT_DATE - interval '7 days') AND CURRENT_DATE`;
  } else if (value.last_30_days) {
    condition += ` AND rs."${key}" BETWEEN 
      (CURRENT_DATE - interval '30 days') AND CURRENT_DATE`;
  } else if (value.is_empty !== undefined) {
    if (value.is_empty) {
      condition += ` AND rs."${key}" IS NULL`;
    } 
  } else if (value.is_not_empty !== undefined) {
    if(value.is_not_empty) {
      condition += ` AND rs."${key}" IS NOT NULL`;
    }
  }
  
  return condition;
}

/**
 * Process default field filters
 * @param key - The field name
 * @param value - The filter value object
 * @returns SQL condition string
 */
private processDefaultFilter(key: string, value: any): string {
  let condition = "";
  
  if (value.equals !== undefined) {
    if (typeof value.equals === "string") {
      condition += ` AND rs."${key}" = '${value.equals}'`;
    } else {
      condition += ` AND rs."${key}" = ${value.equals}`;
    }
  } 
  
  return condition;
}

/**
 * Process simple equality filter
 * @param key - The field name
 * @param value - The filter value
 * @returns SQL condition string
 */
private processSimpleEqualityFilter(key: string, value: any): string {
  if (typeof value === "string") {
    return ` AND rs."${key}" = '${value}'`;
  } else {
    return ` AND rs."${key}" = ${value}`;
  }
}

/**
   * Determines the appropriate sort parameters for resource skill queries.
   * Validates the sort column and ensures the sort order is either ASC or DESC.
   * Falls back to default values if invalid parameters are provided.
   *
   * @param sortBy - Field to sort results by
   * @param sortOrder - Direction to sort (ASC or DESC)
   * @returns Tuple containing validated sort column and order
   */
getSortParameters(sortBy: string, sortOrder: string): [string, string] {
  const validSortColumns = [
    "resource_type",
    "skill_name",
    "slill_level",
    "years_of_experience",
    "start_date",
  ];
  if (!validSortColumns.includes(sortBy)) {
    sortBy = "created_datetime";
  }

  sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
  return [sortBy, sortOrder];
}

}

export default ResourceSkillService;