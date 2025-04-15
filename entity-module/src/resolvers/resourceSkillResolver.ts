import configurations from "../config/config";

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
    getResourceSkill: async (_: any, args:any) => {
      const { 
        rid, 
        page = 1, 
        limit = 10, 
        search = "", 
        filters = {}, 
        sortBy = "created_datetime", 
        sortOrder = "DESC", 
        accountNumber, 
        fiscalYear 
      } = args;

      let parsedFilters = filters;
      if(typeof filters === "string"){
        try {
          parsedFilters = JSON.parse(filters);
        } catch (error) {
          console.error("Error parsing filters:", error);
          throw new Error("Invalid filters format");
        }
    }

      const result = await resourceSkillService.resourceSkillList(
        rid || "",
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        parsedFilters,
        sortBy,
        sortOrder,
        accountNumber,
        fiscalYear
      );

      if (result.statusCode !== 200) {
        throw new Error(result.errorMessage || "Failed to fetch resource skills");
      }

      return result.data;
    },
  },

  Mutation: {
    /**
     * Create a new resource skill
     */
    createResourceSkill: async (_: any, { input }: any) => {
      const result = await resourceSkillService.createResourceSkill(input);
      
      if (result.statusCode !== 200) {
        throw new Error(result.errorMessage || "Failed to create resource skill");
      }
      
      return result.data?.resourceSkill;
    },

    /**
     * Update an existing resource skill
     */
    updateResourceSkill: async (_: any, { input }: any) => {
      const result = await resourceSkillService.updateResourceSkill(input);
      
      if (result.statusCode !== 200) {
        throw new Error(result.errorMessage || "Failed to update resource skill");
      }
      
      return result.data;
    }
  }
};

export default resourceSkillResolvers;