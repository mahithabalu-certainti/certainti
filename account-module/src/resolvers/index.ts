import { IResolvers } from "@graphql-tools/utils";
import { HttpStatus } from "../utils/constant";
import { validateInlineEditPayload } from "../utils/helpers";

type PaginationInput = {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: string;
  globalFilters?: string;
  fiscalYear: number | "FY-All"};

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
  Mutation: {
    updateInlineAccountDetails : async (_, {data} : {data : any}, ctx) => {
      try {
        const requestValidation = validateInlineEditPayload(data)
        if(requestValidation) return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage : requestValidation
          }
          data.userId = ctx.req.headers['x-user-id'];
        const result = await ctx.services.accountGraphqlServices.inlineEditAccount(data);
        if(result.statusCode == HttpStatus.SUCCESS) {
          return {
            statusCode : HttpStatus.SUCCESS,
            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
            statusMessage : result.statusMessage,
            data : result.data
          }
        } else if(result.statusCode == HttpStatus.BAD_REQUEST) {
            return {
            statusCode : HttpStatus.BAD_REQUEST,
            statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
            statusMessage : result.statusMessage,
            data : result.data
          }
        } else {
            return {
            statusCode : HttpStatus.NOT_FOUND,
            statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
            statusMessage : result.statusMessage,
            data : result.data
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
  }
};

export default accountResolvers;
