import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

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
  },
};

export default resourceResolvers;
