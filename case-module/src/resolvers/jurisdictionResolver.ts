import { IResolvers } from "@graphql-tools/utils";
import { JurisdictionService } from "../services/jurisdiction/jurisdictionServices";
import { HttpStatus } from "../utils/constants";


export const jurisdictionResolver: IResolvers = {
  Query: {
    listJurisdictionConfig: async (_, { page, limit, filters, sortBy, sortOrder, search }, ctx) => {
      try {
        // Optionally, get userId from context if needed for access control
        const filterObj = filters || {};
        const data = { page, limit, sortBy, sortOrder, search };
        const result = await ctx.services.jurisdictionService.listJurisdictionConfig(
          data,
          "list",
          filterObj
        );
        if (result.statusCode === HttpStatus.SUCCESS) {
          return {
            statusCode: HttpStatus.SUCCESS,
            statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
            statusMessage: result.message,
            data: {
              configs: result.data?.configs || [],
              count: result.data?.count || 0,
            },
          };
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            statusMessage: result.errorMessage || result.message,
            data: {
              configs: [],
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
            configs: [],
            count: 0,
          },
        };
      }
    },
  },
  Mutation: {
    updateJurisdictionConfig: async (_, { input }, ctx) => {
      try {
         const userId = ctx.req.headers["x-user-id"];
         input.modified_by = userId;
         input.apiType = "graphql";
        const result = await ctx.services.jurisdictionService.updateJurisdictionConfig(input);

        if (result.statusCode === HttpStatus.SUCCESS) {
              const configResult = await ctx.services.jurisdictionService.listJurisdictionConfig(
              { page: 1, limit: 1, sortBy: "created_datetime", sortOrder: "DESC" },
                "graphql",
             {},
                input.config_rid

            );

               
            console.log("Config Result in resolver:", configResult.data.configs[0]);
            if (
              configResult.statusCode === HttpStatus.SUCCESS &&
              configResult.data?.configs &&
              configResult.data.configs.length > 0
            ) {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                message: result.message,
                data: configResult.data.configs[0],
              };
            } else {
              return {
                statusCode: HttpStatus.SUCCESS,
                statusCodeValue: HttpStatus.SUCCESS_MESSAGE,
                message: result.message,
                data: configResult.data.configs[0],
              };
            }
         
        } else {
          return {
            statusCode: result.statusCode,
            statusCodeValue: HttpStatus.FAILED_MESSAGE,
            message: result.errorMessage || result.message,
            data: null,
          };
        }
      } catch (error: any) {
        return {
          statusCode: HttpStatus.FAILED,
          statusCodeValue: HttpStatus.FAILED_MESSAGE,
          message: error.message,
          data: null,
        };
      }
    },
  },
};
