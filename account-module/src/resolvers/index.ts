import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constant";

type PaginationInput = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: string;
  globalFilters?: string;
  fiscalYear?: number;
};

const accountResolvers: IResolvers = {
  Query: {
    getAccounts: async (_, params: { pagination: PaginationInput }, ctx) => {
      try {
        const { limit, page, search, sortBy, sortOrder, filters, globalFilters, fiscalYear} =
          params.pagination;
          
        const result = await ctx.services.accountServices.accountList(
          page,
          limit,
          search,
          filters,
          sortBy,
          sortOrder,
          globalFilters,
          fiscalYear
        );

        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("Account not found");
        }
        return result.data;
      } catch (err) {
        throw new Error("Failed to fetch account");
      }
    },
    getAccountById: async (_, params: { id: string }, ctx) => {
      try {
        const result = await ctx.services.accountServices.accountById(
          params.id
        );

        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("Account not found");
        }
        return result.data.accountById;
      } catch (err) {
        throw new Error("Failed to fetch account by ID");
      }
    },
  },
};

export default accountResolvers;
