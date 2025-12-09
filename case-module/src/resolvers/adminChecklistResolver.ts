import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

// Simple validation for admin checklist update
const validateAdminChecklistUpdateRequest = (data: any): string | null => {
  if (!data.rid) {
    return "Checklist RID is required";
  }
  if (data.checklist_name && typeof data.checklist_name !== 'string') {
    return "Checklist name must be a string";
  }
  if (data.checklist_name && data.checklist_name.trim().length === 0) {
    return "Checklist name cannot be empty";
  }
  if (data.checklist_description && typeof data.checklist_description !== 'string') {
    return "Checklist description must be a string";
  }
  return null;
};

export const adminChecklistResolver: IResolvers = {
  Query: {
    getAdminChecklistList: async (_, { filters, page, limit, sortBy, sortOrder, search }, ctx) => {
      try {
        const userId = ctx.req.headers["x-user-id"];
        
        if (!userId) {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            statusCodeValue: HttpStatus.UNAUTHORIZED_MESSAGE,
            statusMessage: "User ID is required",
            data: {
              checklist: [],
              count: 0,
            },
          };
        }

        // Prepare data object similar to REST API
        const data = {
          page,
          limit,
          sortBy,
          sortOrder,
          search,
        };

        // Convert GraphQL filters to the format expected by the service
        const serviceFilters = filters || {};

        const result = await ctx.services.caseManagementService.listAdminCheckList(
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
              checklist: result.data?.checklist || [],
              count: result.data?.count || 0,
            },
          };
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: {
              checklist: [],
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
            checklist: [],
            count: 0,
          },
        };
      }
    },
  },

  Mutation: {
    updateAdminChecklist: async (_, { data }, ctx) => {
      try {
        // Validate the request data
        const validation = validateAdminChecklistUpdateRequest(data);
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

        // Prepare the checklist data for update
        const checklistUpdateData = {
          ...data,
          checklist_template_rid: data.rid,
          modified_by: userId,
          modified_datetime: new Date(),
        };

        const result = await ctx.services.caseManagementService.updateAdminCheckList(
          checklistUpdateData,
          userId
        );

        if (result.statusCode === HttpStatus.SUCCESS) {
          // Fetch the updated checklist information to return complete data like listchecklist
          try {
            const checklistListResult = await ctx.services.caseManagementService.listAdminCheckList(
              { 
                page: 1,
                limit: 1,
                sortBy: "created_datetime",
                sortOrder: "DESC"
              },
              { rid: data.rid }, // Filter by rid to get the updated checklist
              userId,
              "graphql"
            );

            if (checklistListResult.statusCode === HttpStatus.SUCCESS && 
                checklistListResult.data?.checklist && 
                checklistListResult.data.checklist.length > 0) {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: checklistListResult.data.checklist[0], // Return the first (and only) checklist
              };
            } else {
              // Fallback to original update result if fetching fails
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: result.data?.checklist || null,
              };
            }
          } catch (fetchError) {
            // Fallback to original update result if fetching fails
            return {
              statusCode: HttpStatus.SUCCESS,
              statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
              statusMessage: result.message,
              data: result.data?.checklist || null,
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