import { Op } from "sequelize";
import { ResourceCost } from "../models/resourceCost";
import { Resources } from "../models/resource";
import { HttpStatus } from "../utils/constants";
import { IResourceCost, IUpdateResourceCost } from "../utils/types";
import { createTablesInSchema } from "../models";
import { initMainDbSequelize } from "../config/mainDataSource";
import { ResourceCostTimeline } from "../models/resourceCostTimeline";
import { ResourceCostHistory } from "../models/resourceCostHistory";


class ResourceCostService {
  private resourceCostRepository: typeof ResourceCost | null;

  constructor() {
    this.resourceCostRepository = null;
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
        const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
  
        // Check if account-specific schema exists
        const schemaName = `platform_v2_${accountNumber}`;
        const tableName = "resource_cost";
        const schemaAndTableValidation = await createTablesInSchema(schemaName, tableName);
  
        if (!schemaAndTableValidation) {
          return this.createErrorResponse("Account schema does not exist");
        }
  
        // Query from account-specific schema
        const sequelize = repository.sequelize;
        if (!sequelize) {
          throw new Error("Database connection not available");
        }
  
        // Process currency filters if present
        if (filters && filters.currency) {
          const currencyFilterResult = await this.processCurrencyFilter(filters);
          if (currencyFilterResult) {
            return currencyFilterResult;
          }
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
     * Processes currency filter by querying the main database for matching currency RIDs
     * 
     * @param filters - The filters object containing currency filter
     * @returns Promise with empty result response if no currencies found, null otherwise
     */
    // 
    
    private async processCurrencyFilter(filters: Record<string, any>) {
      // Initialize variables to hold different filter operations
      let currencyValue = null;
      let operation = 'contains'; // Default operation
      let isEmpty = null;
      let isNotEmpty = null;
      
      // Extract filter values based on the filter structure
      if (typeof filters.currency === "object") {
        // Handle different operations
        if (filters.currency.equals !== undefined) {
          currencyValue = filters.currency.equals;
          operation = 'equals';
        } else if (filters.currency.not_equals !== undefined) {
          currencyValue = filters.currency.not_equals;
          operation = 'not_equals';
        } else if (filters.currency.contains !== undefined) {
          currencyValue = filters.currency.contains;
          operation = 'contains';
        } else if (filters.currency.not_contains !== undefined) {
          currencyValue = filters.currency.not_contains;
          operation = 'not_contains';
        } else if (filters.currency.starts_with !== undefined) {
          currencyValue = filters.currency.starts_with;
          operation = 'starts_with';
        } else if (filters.currency.ends_with !== undefined) {
          currencyValue = filters.currency.ends_with;
          operation = 'ends_with';
        } else if (filters.currency.is_empty !== undefined) {
          isEmpty = filters.currency.is_empty;
          operation = 'is_empty';
        } else if (filters.currency.is_not_empty !== undefined) {
          isNotEmpty = filters.currency.is_not_empty;
          operation = 'is_not_empty';
        }
      } else {
        // Simple string value - treat as 'contains'
        currencyValue = filters.currency;
      }
    
      // Handle isEmpty/isNotEmpty separately
      if (operation === 'is_empty') {
        delete filters.currency;
        
        if (isEmpty) {
          // Is Empty
          filters.currency_rid = {
            is_empty: true
          };
        } 
        else if(isNotEmpty){
          // Is Not Empty
          filters.currency_rid = {
            is_not_empty: true
          };
        }
        return null;
      }
    
      // For other operations, we need to query the database
      if (currencyValue) {
        const mainDbSequelize = await initMainDbSequelize();
        
        // Build the query based on the operation
        let currencyQuery = `SELECT rid FROM "public"."currency" WHERE `;
        
        switch (operation) {
          case 'equals':
            currencyQuery += `LOWER(currency_code) = LOWER(:currencyValue) OR LOWER(currency_name) = LOWER(:currencyValue)`;
            break;
          case 'not_equals':
            currencyQuery += `LOWER(currency_code) != LOWER(:currencyValue) OR LOWER(currency_name) != LOWER(:currencyValue)`;
            break;
          case 'contains':
            currencyQuery += `LOWER(currency_code) LIKE LOWER(:likeValue) OR LOWER(currency_name) LIKE LOWER(:likeValue)`;
            break;
          case 'not_contains':
            currencyQuery += `LOWER(currency_code) NOT LIKE LOWER(:likeValue) AND LOWER(currency_name) NOT LIKE LOWER(:likeValue)`;
            break;
          case 'starts_with':
            currencyQuery += `LOWER(currency_code) LIKE LOWER(:startsWithValue) OR LOWER(currency_name) LIKE LOWER(:startsWithValue)`;
            break;
          case 'ends_with':
            currencyQuery += `LOWER(currency_code) LIKE LOWER(:endsWithValue) OR LOWER(currency_name) LIKE LOWER(:endsWithValue)`;
            break;
        }
    
        // Prepare replacements based on the operation
        const replacements: any = {
          currencyValue: currencyValue
        };
        
        if (operation === 'contains' || operation === 'not_contains') {
          replacements.likeValue = `%${currencyValue}%`;
        } else if (operation === 'starts_with') {
          replacements.startsWithValue = `${currencyValue}%`;
        } else if (operation === 'ends_with') {
          replacements.endsWithValue = `%${currencyValue}`;
        }
    
        // Execute the query
        const currencyResults = await mainDbSequelize.query(currencyQuery, {
          replacements: replacements,
          type: "SELECT",
        });
    
        // Extract the RIDs from the results
        const currencyRids = currencyResults.map((result: any) => result.rid);
    
        // If we found matching currencies, add them to the filters
        if (currencyRids.length > 0) {
          // Remove the original currency filter
          delete filters.currency;
    
            filters.currency_rid = {
              in: currencyRids,
            };
          
          return null;
        } else {
          // For 'not' operations, if no matches found, we should include all records
          if (operation === 'not_equals' || operation === 'not_contains') {
            delete filters.currency;
            return null;
          }
          
          // For other operations, if no matches found, return empty result
          return {
            statusCode: HttpStatus.SUCCESS,
            message: HttpStatus.SUCCESS_MESSAGE,
            data: {
              resourceCost: [],
              count: 0,
            },
          };
        }
      }
      return null;
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
          rc.r_number ILIKE :searchTerm 
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
        SELECT rc.*, r.resource_number, r.resource_full_name
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
        WHERE 1=1
        ${filterConditions}
        ${searchCondition}
        ORDER BY rc."${finalSortBy}" ${finalSortOrder}
        LIMIT :limit OFFSET :offset
      `;
  
      // Count query to get total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM "${schemaName}"."resource_cost" rc
        INNER JOIN "${schemaName}"."resources" r ON rc.resource_rid = r.rid
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
  
      const resourceCost = results;
      const totalCount = countResult ? (countResult as any).total : 0;
  
      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: {
          resourceCost: resourceCost,
          count: parseInt(totalCount, 10),
        },
      };
    }

  /**
   * Process filters for raw SQL query by converting filter object to SQL WHERE conditions.
   * Handles different types of filters (alphanumeric, numeric, date) with various operators.
   * Also processes special filters like compensationFrequency and resourceNumber.
   *
   * @param filters - The filters object from the request
   * @returns string - SQL WHERE clause fragment for filters
   */
  private processFiltersForRawQuery(filters: Record<string, any>): string {
    let filterConditions = "";

    // Define field types for proper filter handling
    const alphanumericFields = ["currency_rid"];
    const numericFields = [
      "annual_cost",
      "monthly_cost",
      "weekly_cost",
      "daily_cost",
      "hourly_cost",
      "bi_weekly_cost",
      "semi_annual_cost",
    ];
    const dateFields = ["effective_date", "end_date"];
    const specialFields = ["resourceNumber"];

    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      // Skip special fields that have custom handling
      if (specialFields.includes(key)) {
        return;
      }

      // Handle different filter types based on field type
      if (typeof value === "object") {
        if (alphanumericFields.includes(key)) {
          filterConditions += this.processAlphanumericFilter(key, value);
        } else if (numericFields.includes(key)) {
          filterConditions += this.processNumericFilter(key, value);
        } else if (dateFields.includes(key)) {
          filterConditions += this.processDateFilter(key, value);
        } else {
          filterConditions += this.processDefaultFilter(key, value);
        }
      } else if (value !== undefined && value !== null) {
        // Simple equality
        filterConditions += this.processSimpleEqualityFilter(key, value);
      }
    });

    // Special handling for resource number which might be in the resources table
    if (filters.resourceNumber) {
      filterConditions += this.processResourceNumberFilter(filters.resourceNumber);
    }

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
      condition += ` AND rc."${key}" = '${value.equals}'`;
    } else if (value.not_equals) {
      condition += ` AND rc."${key}" != '${value.not_equals}'`;
    } else if (value.contains) {
      condition += ` AND rc."${key}" ILIKE '%${value.contains}%'`;
    } else if (value.not_contains) {
      condition += ` AND rc."${key}" NOT ILIKE '%${value.not_contains}%'`;
    } else if (value.starts_with) {
      condition += ` AND rc."${key}" ILIKE '${value.starts_with}%'`;
    } else if (value.ends_with) {
      condition += ` AND rc."${key}" ILIKE '%${value.ends_with}'`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND (rc."${key}" IS NULL OR rc."${key}" = '')`;
      } 
    }
    else if (value.is_not_empty !== undefined) {
     if(value.is_not_empty) {
      condition += ` AND rc."${key}" IS NOT NULL AND rc."${key}" != ''`;
     }      
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.map((item: string) => `'${item}'`).join(",");
      condition += ` AND rc."${key}" IN (${values})`;
    } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
      const values = value.not_in.map((item: string) => `'${item}'`).join(",");
      condition += ` AND rc."${key}" NOT IN (${values})`;
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
      condition += ` AND rc."${key}" = ${value.equals}`;
    } else if (value.not_equals !== undefined) {
      condition += ` AND rc."${key}" != ${value.not_equals}`;
    } else if (value.greater_than !== undefined) {
      condition += ` AND rc."${key}" > ${value.greater_than}`;
    } else if (value.less_Than !== undefined) {
      condition += ` AND rc."${key}" < ${value.less_than}`;
    } else if (value.between && Array.isArray(value.between) && value.between.length === 2) {
      condition += ` AND rc."${key}" BETWEEN ${value.between[0]} AND ${value.between[1]}`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rc."${key}" IS NULL`;
      } 
    }
    else if (value.is_not_empty !== undefined) {
      if (value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL`;
      }
    }
    else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      const values = value.in.join(",");
      condition += ` AND rc."${key}" IN (${values})`;
    } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
      const values = value.not_in.join(",");
      condition += ` AND rc."${key}" NOT IN (${values})`;
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
      condition += ` AND rc."${key}"::date = '${value.equals}'::date`;
    } else if (value.not_equals) {
      condition += ` AND rc."${key}"::date != '${value.not_equals}'::date`;
    } else if (value.before) {
      condition += ` AND rc."${key}" < '${value.before}'`;
    } else if (value.after) {
      condition += ` AND rc."${key}" > '${value.after}'`;
    } else if (value.between && Array.isArray(value.between) && value.between.length === 2) {
      condition += ` AND rc."${key}" BETWEEN '${value.between[0]}' AND '${value.between[1]}'`;
    } else if (value.this_week) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('week', CURRENT_DATE) AND 
        (date_trunc('week', CURRENT_DATE) + interval '6 days')`;
    } else if (value.this_month) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('month', CURRENT_DATE) AND 
        (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')`;
    } else if (value.this_quarter) {
      condition += ` AND rc."${key}" BETWEEN 
        date_trunc('quarter', CURRENT_DATE) AND 
        (date_trunc('quarter', CURRENT_DATE) + interval '3 months - 1 day')`;
    } else if (value.last_7_days) {
      condition += ` AND rc."${key}" BETWEEN 
        (CURRENT_DATE - interval '7 days') AND CURRENT_DATE`;
    } else if (value.last_30_days) {
      condition += ` AND rc."${key}" BETWEEN 
        (CURRENT_DATE - interval '30 days') AND CURRENT_DATE`;
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        condition += ` AND rc."${key}" IS NULL`;
      } 
    } else if (value.is_not_empty !== undefined) {
      if(value.is_not_empty) {
        condition += ` AND rc."${key}" IS NOT NULL`;
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
        condition += ` AND rc."${key}" = '${value.equals}'`;
      } else {
        condition += ` AND rc."${key}" = ${value.equals}`;
      }
    } else if (value.in && Array.isArray(value.in) && value.in.length > 0) {
      if (typeof value.in[0] === "string") {
        const values = value.in.map((item: string) => `'${item}'`).join(",");
        condition += ` AND rc."${key}" IN (${values})`;
      } else {
        const values = value.in.join(",");
        condition += ` AND rc."${key}" IN (${values})`;
      }
    } else if (value.not_in && Array.isArray(value.not_in) && value.not_in.length > 0) {
      if (typeof value.not_in[0] === "string") {
        const values = value.not_in.map((item: string) => `'${item}'`).join(",");
        condition += ` AND rc."${key}" NOT IN (${values})`;
      } else {
        const values = value.not_in.join(",");
        condition += ` AND rc."${key}" NOT IN (${values})`;
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
      return ` AND rc."${key}" = '${value}'`;
    } else {
      return ` AND rc."${key}" = ${value}`;
    }
  }

  // /**
  //  * Process compensation frequency filter
  //  * @param frequency - The compensation frequency filter value
  //  * @returns SQL condition string
  //  */
  // private processCompensationFrequencyFilter(frequency: any): string {
  //   let condition = "";
    
  //   // Helper function to add the appropriate condition based on frequency value
  //   const addFrequencyCondition = (freqValue: string) => {
  //     if (freqValue === "Annual") {
  //       return ` rc."annual_cost" IS NOT NULL AND rc."annual_cost" > 0`;
  //     } else if (freqValue === "Monthly") {
  //       return ` rc."monthly_cost" IS NOT NULL AND rc."monthly_cost" > 0`;
  //     } else if (freqValue === "Weekly") {
  //       return ` rc."weekly_cost" IS NOT NULL AND rc."weekly_cost" > 0`;
  //     } else if (freqValue === "Daily") {
  //       return ` rc."daily_cost" IS NOT NULL AND rc."daily_cost" > 0`;
  //     } else if (freqValue === "Hourly") {
  //       return ` rc."hourly_cost" IS NOT NULL AND rc."hourly_cost" > 0`;
  //     } else if (freqValue === "Biweekly") {
  //       return ` rc."bi_weekly_cost" IS NOT NULL AND rc."bi_weekly_cost" > 0`;
  //     } else if (freqValue === "Semi-Annual") {
  //       return ` rc."semi_annual_cost" IS NOT NULL AND rc."semi_annual_cost" > 0`;
  //     }
  //     return null;
  //   };
    
  //   if (typeof frequency === "object") {
  //     // Equals - single value match
  //     if (frequency.equals) {
  //       const freqCondition = addFrequencyCondition(frequency.equals);
  //       if (freqCondition) {
  //         condition += ` AND (${freqCondition})`;
  //       }
  //     } 
  //     // Not Equals - exclude single value
  //     else if (frequency.notEquals) {
  //       const freqCondition = addFrequencyCondition(frequency.notEquals);
  //       if (freqCondition) {
  //         condition += ` AND NOT (${freqCondition})`;
  //       }
  //     } 
  //     // In - multiple values (array)
  //     else if (frequency.in && Array.isArray(frequency.in) && frequency.in.length > 0) {
  //       const conditions = frequency.in
  //         .map(addFrequencyCondition)
  //         .filter(Boolean);
          
  //       if (conditions.length > 0) {
  //         condition += ` AND (${conditions.join(" OR ")})`;
  //       }
  //     } 
  //     // Not In - exclude multiple values (array)
  //     else if (frequency.notIn && Array.isArray(frequency.notIn) && frequency.notIn.length > 0) {
  //       const conditions = frequency.notIn
  //         .map(addFrequencyCondition)
  //         .filter(Boolean);
          
  //       if (conditions.length > 0) {
  //         condition += ` AND NOT (${conditions.join(" OR ")})`;
  //       }
  //     } 
  //     // Is Empty / Is Not Empty
  //     else if (frequency.isEmpty !== undefined) {
  //       if (frequency.isEmpty) {
  //         // All cost fields are null or zero
  //         condition += ` AND (
  //           (rc."annual_cost" IS NULL OR rc."annual_cost" = 0) AND
  //           (rc."semi_annual_cost" IS NULL OR rc."semi_annual_cost" = 0) AND
  //           (rc."monthly_cost" IS NULL OR rc."monthly_cost" = 0) AND
  //           (rc."weekly_cost" IS NULL OR rc."weekly_cost" = 0) AND
  //           (rc."bi_weekly_cost" IS NULL OR rc."bi_weekly_cost" = 0) AND
  //           (rc."daily_cost" IS NULL OR rc."daily_cost" = 0) AND
  //           (rc."hourly_cost" IS NULL OR rc."hourly_cost" = 0)
  //         )`;
  //       } else {
  //         // At least one cost field has a value
  //         condition += ` AND (
  //           rc."annual_cost" > 0 OR
  //           rc."semi_annual_cost" > 0 OR
  //           rc."monthly_cost" > 0 OR
  //           rc."weekly_cost" > 0 OR
  //           rc."bi_weekly_cost" > 0 OR
  //           rc."daily_cost" > 0 OR
  //           rc."hourly_cost" > 0
  //         )`;
  //       }
  //     }
  //   } else if (typeof frequency === "string") {
  //     // Handle direct string value (backward compatibility)
  //     const freqCondition = addFrequencyCondition(frequency);
  //     if (freqCondition) {
  //       condition += ` AND (${freqCondition})`;
  //     }
  //   }
    
  //   return condition;
  // }

  /**
   * Process resource number filter
   * @param resourceNumber - The resource number filter value
   * @returns SQL condition string
   */
  private processResourceNumberFilter(resourceNumber: any): string {
    let condition = "";
    
    if (typeof resourceNumber === "object") {
      if (resourceNumber.equals) {
        condition += ` AND r."resource_number" = '${resourceNumber.equals}'`;
      } else if (resourceNumber.not_equals) {
        condition += ` AND r."resource_number" != '${resourceNumber.not_equals}'`;
      } else if (resourceNumber.contains) {
        condition += ` AND r."resource_number" ILIKE '%${resourceNumber.contains}%'`;
      } else if (resourceNumber.not_contains) {
        condition += ` AND r."resource_number" NOT ILIKE '%${resourceNumber.not_contains}%'`;
      } else if (resourceNumber.starts_with) {
        condition += ` AND r."resource_number" ILIKE '${resourceNumber.starts_with}%'`;
      } else if (resourceNumber.ends_with) {
        condition += ` AND r."resource_number" ILIKE '%${resourceNumber.ends_with}'`;
      } else if (resourceNumber.is_empty !== undefined) {
        if (resourceNumber.is_empty) {
          condition += ` AND (r."resource_number" IS NULL OR r."resource_number" = '')`;
        } 
      } else if(resourceNumber.is_not_empty !== undefined) {
        if (resourceNumber.is_not_empty) {
          condition += ` AND (r."resource_number" IS NOT NULL OR r."resource_number" != '')`;
        } 
      }
      else if (resourceNumber.in && Array.isArray(resourceNumber.in) && resourceNumber.in.length > 0) {
        const values = resourceNumber.in
          .map((item: string) => `'${item}'`)
          .join(",");
        condition += ` AND r."resource_number" IN (${values})`;
      } else if (resourceNumber.not_in && Array.isArray(resourceNumber.not_in) && resourceNumber.not_in.length > 0) {
        const values = resourceNumber.not_in
          .map((item: string) => `'${item}'`)
          .join(",");
        condition += ` AND r."resource_number" NOT IN (${values})`;
      }
    } else if (resourceNumber) {
      condition += ` AND r."resource_number" = '${resourceNumber}'`;
    }
    
    return condition;
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
        accountNumber
      } = resourceCost;

      const schemaName = `platform_v2_${accountNumber}`;
      
      // Create both tables in parallel for better performance
      const [resourceCostTableCreated, timelineTableCreated] = await Promise.all([
        createTablesInSchema(schemaName, "resource_cost"),
        createTablesInSchema(schemaName, "resource_cost_timeline")
      ]);

      if (!resourceCostTableCreated) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Account schema or resource_cost table could not be created",
        };
      }

      else if(!timelineTableCreated){
         return {
           statusCode: HttpStatus.FAILED,
           message: HttpStatus.FAILED_MESSAGE,
           errorMessage: "Account schema or resource_cost_timeline table could not be created",
         }
      }

      const sequelize = repository.sequelize;
      if (!sequelize) {
        throw new Error("Database connection not available");
      }

      // Set the schema for this connection
      await sequelize.query(`SET search_path To "${schemaName}"`);
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
): Promise<void> {
  try {
    
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


    const schemaName = `platform_v2_${accountNumber}`;
    const tableName = "resource_cost_timeline";
    const schemaAndTableValidation = await createTablesInSchema(
      schemaName,
      tableName
    );

    // Also create the history table
    await createTablesInSchema(schemaName, "resource_cost_history");

    if (!schemaAndTableValidation) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Account schema does not exist",
      };
    }

    const sequelize = repository.sequelize;
    if (!sequelize) {
      throw new Error("Database connection not available");
    }

    // Set the schema for this connection
    await sequelize.query(`SET search_path To "${schemaName}"`);

    // Get the original resource cost before updating
    const originalResourceCost = await repository.findOne({
      where: { rid: rid }
    });

    if (!originalResourceCost) {
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: "Resource cost record not found",
      };
    }

      try{
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
 * Creates history records for changed attributes in resource cost
 * @param oldResourceCost - The original resource cost object before changes
 * @param newResourceCost - The updated resource cost object after changes
 * @param modifiedBy - The user who performed the action
 */
private async createResourceCostHistory(
  oldResourceCost: any,
  newResourceCost: any,
  modifiedBy: string,
  accountNumber: string,
): Promise<void> {
  try {
    // Get the repository and sequelize instance
    const repository = this.getResourceCostRepository();
    const sequelize = repository.sequelize;
    if (!sequelize) {
      throw new Error("Database connection not available");
    }

    // Make sure we're in the right schema context
    const schemaName = `platform_v2_${accountNumber}`;
    // Verify the table exists in the schema
    const tableExists = await createTablesInSchema(schemaName, "resource_cost_history");
    if (!tableExists) {
      throw new Error(`Table resource_cost_history does not exist in schema ${schemaName}`);
    }
    
    // Set the schema context explicitly
    await sequelize.query(`SET search_path TO "${schemaName}"`);
    
    // Make sure ResourceCostHistory is initialized with the current sequelize instance
    if (ResourceCostHistory.sequelize) {
      ResourceCostHistory.initialize(ResourceCostHistory.sequelize);
    }
    
    // Define the attributes to track changes for
    const trackedAttributes = [
      'eid',
      'effective_date',
      'end_date',
      'annual_cost',
      'semi_annual_cost',
      'monthly_cost',
      'weekly_cost',
      'bi_weekly_cost',
      'daily_cost',
      'hourly_cost',
      'currency_rid',
      'fiscal_year',
      'status'
    ];
    
    // Track changes for each attribute individually to better isolate errors
    for (const attribute of trackedAttributes) {
      try {
        const oldValue = oldResourceCost[attribute];
        const newValue = newResourceCost[attribute];
        
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
          await ResourceCostHistory.create({
            resource_cost_rid: newResourceCost.rid,
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
   * Retrieves a specific resource cost record by ID from the specified account schema.
   * Includes the associated Resource record in the result.
   *
   * @param id - Unique identifier of the resource cost record
   * @param accountNumber - Account identifier for schema selection
   * @returns Promise resolving to status object with resource cost data or error message
   */
  async resourceCostById(id: string, accountNumber: string) {
    try {
      const repository = await this.getResourceCostRepository();
      const schemaName = `platform_v2_${accountNumber}`;

      const sequelize = repository.sequelize;
      if (!sequelize) {
        throw new Error("Database connection not available");
      }

      // Set the schema for this connection
      await sequelize.query(`SET search_path To "${schemaName}"`);

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
