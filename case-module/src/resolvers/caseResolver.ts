import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

// Simple validation for inline case update
const validateCaseUpdateRequest = (data: any): string | null => {
  if (!data.account_rid) {
    return "Account RID is required";
  }
  if (!data.case_rid) {
    return "Case RID is required";
  }
  if (data.case_name && typeof data.case_name !== 'string') {
    return "Case name must be a string";
  }
  if (data.fiscal_year && (!Number.isInteger(data.fiscal_year) || data.fiscal_year < 1900 || data.fiscal_year > 3000)) {
    return "Fiscal year must be a valid integer between 1900 and 3000";
  }
  return null;
};

export const caseResolver: IResolvers = {
  Query: {
    getCasesList: async (_, { account_rid, filters, page, limit, sortBy, sortOrder }, ctx) => {
      try {
        const userId = ctx.req.headers["x-user-id"];
        
        if (!userId) {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            statusCodeValue: HttpStatus.UNAUTHORIZED_MESSAGE,
            statusMessage: "User ID is required",
            data: {
              caseInfo: [],
              count: 0,
            },
          };
        }

        // Prepare data object similar to REST API
        const data = {
          account_rid,
          page,
          limit,
          sortBy,
          sortOrder,
        };

        // Convert GraphQL filters to the format expected by the service
        const serviceFilters = filters || {};

        const result = await ctx.services.caseService.listAllCasesAccount(
          data,
          serviceFilters,
          userId,
          "list"
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: result.message,
            data: {
              caseInfo: result.data?.caseInfo || [],
              count: result.data?.count || 0,
            },
          };
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: {
              caseInfo: [],
              count: 0,
            },
          };
        }
      } catch (error: any) {
        return {
          statusCode: HttpStatus.FAILED,
          statusCodeValue: HttpStatus.FAILED_MESSAGE,
          statusMessage: error.message,
          data: {
            caseInfo: [],
            count: 0,
          },
        };
      }
    },
  },

  Mutation: {
    updateInlineCaseDetails: async (_, { data }, ctx) => {
      try {
        // Validate the request data
        const validation = validateCaseUpdateRequest(data);
        if (validation) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            statusCodeValue: HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage: validation,
            data: null,
          };
        }

        const userId = ctx.req.headers["x-user-id"];
        
        if (!userId) {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            statusCodeValue: HttpStatus.UNAUTHORIZED_MESSAGE,
            statusMessage: "User ID is required",
            data: null,
          };
        }

        // Prepare the case data for update - need to map case_rid to rid for the service
        const caseUpdateData = {
          ...data,
          modified_by: userId,
        };


        const result = await ctx.services.caseService.updateCase(
          caseUpdateData,
          userId
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
          // Fetch the updated case information with all joined fields
          try {
            const caseListResult = await ctx.services.caseService.listAllCasesAccount(
              { 
                account_rid: data.account_rid,
                page: 1,
                limit: 1 
              },
              { rid: data.case_rid }, // Filter by rid (the primary key of the case)
              userId,
              "get"
            );

            if (caseListResult.statusCode === HttpStatus.SUCCESS && 
                caseListResult.data?.caseInfo && 
                caseListResult.data.caseInfo.length > 0) {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: caseListResult.data.caseInfo[0], // Return the first (and only) case
              };
            } else {
              // Fallback to original update result if fetching fails
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: result.data?.cases || null,
              };
            }
          } catch (fetchError) {
            // Fallback to original update result if fetching fails
            return {
              statusCode: HttpStatus.SUCCESS,
              statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
              statusMessage: result.message,
              data: result.data?.cases || null,
            };
          }
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: null,
          };
        }
      } catch (error: any) {
        return {
          statusCode: HttpStatus.FAILED,
          statusCodeValue: HttpStatus.FAILED_MESSAGE,
          statusMessage: error.message,
          data: null,
        };
      }
    },
  },
};