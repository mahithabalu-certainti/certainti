import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { validateResourceRequest } from "../utils/helpers";

type PaginationInput = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: string;
  fiscalYear: string;
};

const resourceResolvers: IResolvers = {
  Query: {
    getResources: async (
      _,
      params: { r_number: string; pagination: PaginationInput },
      ctx
    ) => {
      try {
        const { limit, page, search, sortBy, sortOrder, filters, fiscalYear } =
          params.pagination || {};

        const result = await ctx.services.resourceService.resourcesList(
          params.r_number,
          fiscalYear,
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder
        );

        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("Account not found");
        }
        return result.data;
      } catch (err) {
        throw new Error("Failed to fetch resources");
      }
    },
    getResourceById: async (
      _,
      params: { rid: string; r_number: string },
      ctx
    ) => {
      const result = await ctx.services.resourceService.resourceById(
        params.r_number,
        params.rid
      );

      if (result.statusCode !== 200) {
        throw new Error(result.errorMessage || "Failed to fetch resource");
      }

      return result.data.resourceDetails.dataValues;
    },
  },
  Mutation: {
    createResource: async (_: any, { input }: any, ctx) => {
      const result = await ctx.services.resourceService.createResource(input);

      if (result.statusCode !== 200) {
        throw new Error(
          result.errorMessage || "Failed to create resource skill"
        );
      }

      return result.data?.resource;
    },
    updateResource: async (_: any, { input }: any, ctx) => {
      const result = await ctx.services.resourceService.updateResource(input);

      if (result.statusCode !== 200) {
        throw new Error(
          result.errorMessage || "Failed to create resource skill"
        );
      }

      return result?.data?.resource?.[0] || 0;
    },

    updateResourceInline : async (_, {data} : {data : any}, ctx) => {
      try {
        const requestValidation = validateResourceRequest(data)
        if(requestValidation) {
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage : requestValidation
          }
        }
        data.userId = ctx.req.headers['x-user-id']
        const result = await ctx.services.resourceGraphQlServices.inLineEditResources(data)
        if(result.statusCode == HttpStatus.SUCCESS) {
          return {
            statusCode : HttpStatus.SUCCESS,
            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
            statusMessage : STATUS_MESSAGE.resourceUpdateSuccess
          }
        } 
        else if(result.statusCode == HttpStatus.NOT_FOUND) {
          return {
            statusCode : HttpStatus.NOT_FOUND,
            statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
            statusMessage : result.statusMessage
          }
        }
        else if(result.statusCode == HttpStatus.BAD_REQUEST) {
          return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage : result.statusMessage
          }
        }
      } catch (error : any) {
        return {
            statusCode : HttpStatus.FAILED,
            statusCodeValue : HttpStatus.FAILED_MESSAGE,
            statusMessage : error.message
          }
      }
    }
  },
};

export default resourceResolvers;
