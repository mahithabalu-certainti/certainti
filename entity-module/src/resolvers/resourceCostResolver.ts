import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constants";

type PaginationInput = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: Record<string, any>;
  accountNumber: string;
  fiscalYear: number;
};

const resourceCostResolvers: IResolvers = {
  // Add a resolver for the ResourceCost type to format dates
  ResourceCost: {
    effective_date: (parent) => {
      try {
        if (!parent.effective_date) return null;
        return new Date(Number(parent.effective_date)).toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting effective_date:', error);
        return null;
      }
    },
    end_date: (parent) => {
      try {
        if (!parent.end_date) return null;
        return new Date(Number(parent.end_date)).toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting end_date:', error);
        return null;
      }
    },
    created_datetime: (parent) => {
      try {
        if (!parent.created_datetime) return null;
        return new Date(Number(parent.created_datetime)).toISOString();
      } catch (error) {
        console.error('Error formatting created_datetime:', error);
        return null;
      }
    },
    modified_datetime: (parent) => {
      try {
        if (!parent.modified_datetime) return null;
        return new Date(Number(parent.modified_datetime)).toISOString();
      } catch (error) {
        console.error('Error formatting modified_datetime:', error);
        return null;
      }
    }
  },
  Query: {
    getResourceCosts: async (
      _,
      params: { pagination: PaginationInput },
      ctx
    ) => {
      try {
        const { limit, page, search, sortBy, sortOrder, filters, accountNumber, fiscalYear } =
          params.pagination;

        const result = await ctx.services.resourceCostServices.resourceCostList(
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder,
          accountNumber,
          fiscalYear
        );
        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("ResourceCost not found");
        }
        return result.data;
      } catch (err) {
        throw new Error("Failed to fetch ResourceCost");
      }
    },
    getResourceCost: async (_, { id, accountNumber }, ctx) => {
      try {
        const result = await ctx.services.resourceCostServices.resourceCostById(
          id,
          accountNumber,
        );
        if (result.statusCode!== HttpStatus.SUCCESS) {
          throw new Error("ResourceCost not found");
        }
        return result.data.resourceCostById;
      } catch (err) {
        throw new Error("Failed to fetch ResourceCost by id");
      } 
    },
  },

  Mutation: {
    createResourceCost: async (_, { input }, ctx) => {
      try {
        const result =
          await ctx.services.resourceCostServices.createResourceCost(input,"");
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
          await ctx.services.resourceCostServices.updateResourceCost(input,"");
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
