import configurations from "../config/config";
import { HttpStatus } from "../utils/constants";
import { validateResourceSkill } from "../utils/helpers";

const services = configurations.getInstance().getServices();
const resourceSkillService = services.resourceSkillServices;

/**
 * GraphQL Resolvers for Resource Skills
 */
const resourceSkillResolvers = {
  Query: {
    /**
     * Get resource skills with optional filtering, pagination, and sorting
     */
    getResourceSkills: async (_: any, args: any) => {
      const {
        page = 1,
        limit = 10,
        search = "",
        filters = {},
        sortBy = "created_datetime",
        sortOrder = "DESC",
        accountNumber,
        fiscalYear,
        resourceRid,
      } = args;

      let parsedFilters = filters;
      if (typeof filters === "string") {
        try {
          parsedFilters = JSON.parse(filters);
        } catch (error) {
          console.error("Error parsing filters:", error);
          throw new Error("Invalid filters format");
        }
      }

      const result = await resourceSkillService.resourceSkillList(
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        parsedFilters,
        sortBy,
        sortOrder,
        accountNumber,
        fiscalYear,
        resourceRid
      );

      if (result.statusCode !== 200) {
        throw new Error(
          result.errorMessage || "Failed to fetch resource skills"
        );
      }

      return result.data;
    },
    getResourceSkill: async (
      _: any,
      { id, accountNumber }: { id: string; accountNumber: string },
      ctx: any
    ) => {
      try {
        const result = await ctx.services.resourceSkillServices.resourceSkillById(
          id,
          accountNumber
        );
        if (result.statusCode !== HttpStatus.SUCCESS) {
          throw new Error("ResourceSkill not found");
        }
        return result.data.resourceCostById;
      } catch (err) {
        throw new Error("Failed to fetch ResourceSkill by id");
      }
    },
  },

  Mutation: {
    /**
     * Create a new resource skill
     */
    createResourceSkill: async (_: any, { input }: any) => {
      const result = await resourceSkillService.createResourceSkill(input, "");

      if (result.statusCode !== 200) {
        throw new Error(
          result.errorMessage || "Failed to create resource skill"
        );
      }

      return result.data?.resourceSkill;
    },

    /**
     * Update an existing resource skill
     */
    updateResourceSkill: async (_: any, { input }: any) => {
      const result = await resourceSkillService.updateResourceSkill(input, "");

      if (result.statusCode !== 200) {
        throw new Error(
          result.errorMessage || "Failed to update resource skill"
        );
      }

      return result.data;
    },

    updateResourceSkillInline : async(_ : any, {data} : {data : any}, ctx : any) => {
      try {
      data.userId = ctx.req.headers['x-user-id']
      const requestValidation = validateResourceSkill(data);
      if(requestValidation) {
        return {
          statusCode : HttpStatus.BAD_REQUEST,
          statusCodeValue : HttpStatus.BAD_REQUEST_MESSAGE,
          statusMessage : requestValidation
        }
      }
      const result = await ctx.services.resourceSkillGraphqlServices.updateInlineResourceSkill(data)
      if(result.statusCode == HttpStatus.SUCCESS) {
        return {
          statusCode : HttpStatus.SUCCESS,
          statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
          statusMessage : result.statusMessage
        }
      }
      else {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
          statusMessage : result.statusMessage
        }
      } 
      } catch (error : any) {
        return {
          statusCode : HttpStatus.NOT_FOUND,
          statusCodeValue : HttpStatus.NOT_FOUND_MESSAGE,
          statusMessage : error.message
        }
      }
    }
  },
};

export default resourceSkillResolvers;
