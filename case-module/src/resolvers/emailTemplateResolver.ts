import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

const validateEmailTemplateUpdateRequest = (data: any): string | null => {
  if (!data.email_template_rid) {
    return "Email Template RID is required";
  }
  if (data.template_name && typeof data.template_name !== "string") {
    return "Template name must be a string";
  }
  if (data.template_name && data.template_name.trim().length === 0) {
    return "Template name cannot be empty";
  }
  if (data.subject && typeof data.subject !== "string") {
    return "Subject must be a string";
  }
  return null;
};

export const emailTemplateResolver: IResolvers = {
  Query: {
    getEmailTemplateList: async (_, { filters, page, limit, sortBy, sortOrder, search }, ctx) => {
      try {
        const userId = ctx.req.headers["x-user-id"];
        if (!userId) {
          return {
            statusCode: HttpStatus.UNAUTHORIZED,
            statusCodeValue: HttpStatus.UNAUTHORIZED_MESSAGE,
            statusMessage: "User ID is required",
            data: {
              templates: [],
              count: 0,
            },
          };
        }
        const data = { page, limit, sortBy, sortOrder, search };
        const serviceFilters = filters || {};
        const result = await ctx.services.caseManagementService.listEmailTemplates(
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
              templates: result.data?.templates || [],
              count: result.data?.count || 0,
            },
          };
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: {
              templates: [],
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
            templates: [],
            count: 0,
          },
        };
      }
    },
  },

  Mutation: {
    updateEmailTemplate: async (_, { data }, ctx) => {
      try {
        const validation = validateEmailTemplateUpdateRequest(data);
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
        const templateUpdateData = {
          ...data,
          modified_by: userId,
          modified_datetime: new Date(),
        };
        const result = await ctx.services.caseManagementService.updateEmailTemplate(
          templateUpdateData,
          userId
        );
        if (result.statusCode === HttpStatus.SUCCESS) {
          try {
            const templateListResult = await ctx.services.caseManagementService.listEmailTemplates(
              { page: 1, limit: 1, sortBy: "created_datetime", sortOrder: "DESC" },
              { rid: data.email_template_rid },
              userId,
              "graphql",
              data.email_template_rid
            );
            if (
              templateListResult.statusCode === HttpStatus.SUCCESS &&
              templateListResult.data?.emailTemplates &&
              templateListResult.data.emailTemplates.length > 0
            ) {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: templateListResult.data.emailTemplates[0],
              };
            } else {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                statusMessage: result.message,
                data: result.data?.template || null,
              };
            }
          } catch (fetchError) {
            return {
              statusCode: HttpStatus.SUCCESS,
              statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
              statusMessage: result.message,
              data: result.data?.emailTemplates || null,
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
