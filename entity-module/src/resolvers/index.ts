import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

type PaginationInput = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: Record<string, any>;
};

const resourceCostResolvers: IResolvers = {
  Query: {
    getResourceCosts: async (
      _,
      params: { pagination: PaginationInput },
      ctx
    ) => {
      try {
        const { limit, page, search, sortBy, sortOrder, filters } =
          params.pagination;

        const result = await ctx.services.resourceCostServices.resourceCostList(
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder
        );
        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("ResourceCost not found");
        }
        return result.data;
      } catch (err) {
        throw new Error("Failed to fetch ResourceCost");
      }
    },
  },

  Mutation: {
    createResourceCost: async (_, { input }, ctx) => {
      try {
        const result =
          await ctx.services.resourceCostServices.createResourceCost(input);
        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("Unable to create resourceCost");
        }
        return result.data.resourceCost;
      } catch (err) {
        console.log("Failed to create resourceCost record");
        return err;
      }
    },
    updateResourceCost: async (_, { input }, ctx) => {
      try {
        const result =
          await ctx.services.resourceCostServices.updateResourceCost(input);
        console.log("Result : ", result);
        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("Unable to update resourceCost");
        }
        return result.data.resourceCost;
      } catch (err) {
        console.log("Failed to update resourceCost");
        return err;
      }
    },
  },
};

export default resourceCostResolvers;
