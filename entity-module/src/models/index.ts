import { initOrgSequelize } from "../config/orgDataSource";
import { Resources } from "./resource";
import { ResourceCost } from "./resourceCost";
import { ResourceCostHistory } from "./resourceCostHistory";
import { ResourceCostTimeline } from "./resourceCostTimeline";
import { ResourceSkill } from "./resourceSkill";
import { ResourceSkillHistory } from "./resourceSkillHistory";
import { ResourceSkillTimeline } from "./resourceSkillTimeline";
import { Skill } from "./skill";

export const models: {
  Resources: typeof Resources;
  ResourceCost: typeof ResourceCost;
  ResourceCostTimeline: typeof ResourceCostTimeline;
  ResourceCostHistory: typeof ResourceCostHistory;
  ResourceSkill: typeof ResourceSkill;
  Skill: typeof Skill;
  ResourceSkillTimeline: typeof ResourceSkillTimeline;
  ResourceSkillHistory: typeof ResourceSkillHistory;
} = {
  Resources: Resources,
  ResourceCost: ResourceCost,
  ResourceCostTimeline: ResourceCostTimeline,
  ResourceCostHistory: ResourceCostHistory,
  ResourceSkill: ResourceSkill,
  Skill: Skill,
  ResourceSkillTimeline: ResourceSkillTimeline,
  ResourceSkillHistory: ResourceSkillHistory
};

export async function createTablesInSchema(
  schemaName: string,
  tableName?: string
) {
  try {
    const sequelize = await initOrgSequelize();

    // Check if schema exists, create if it doesn't
    const schemaExists = await checkSchemaExists(sequelize, schemaName);
    if (!schemaExists) {
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      console.log(`Schema ${schemaName} created`);
    }

    // Set the schema for this connection
    await sequelize.query(`SET search_path TO "${schemaName}"`);

    if (tableName) {
      // Check if the specific table exists
      const tableExists = await checkTableExists(
        sequelize,
        schemaName,
        tableName
      );

      if (!tableExists) {
        // Create only the specified table
        switch (tableName) {
          case "resources":
            await sequelize.models.Resources.sync({ 
              force: false,
              schema: schemaName // Explicitly set schema
            });
            break;
          case "resource_cost":
            await sequelize.models.ResourceCost.sync({ 
              force: false,
              schema: schemaName // Explicitly set schema
            });
            break;
          case "resource_cost_audit_log":
            await sequelize.models.ResourceCostAuditLog.sync({ 
              force: false,
              schema: schemaName // Explicitly set schema
            });
            break;
          case "resource_cost_timeline":
            await sequelize.models.ResourceCostTimeline.sync({ 
              force: false,
              schema: schemaName // Explicitly set schema
            });  
            break;
          case "resource_cost_history":
            await sequelize.models.ResourceCostHistory.sync({
              force: false,
              schema: schemaName // Explicitly set schema
            });
            break;
          case "resource_skill":
            await sequelize.models.ResourceSkill.sync({
              force: false,
              schema: schemaName // Explicitly set schema
            })   
            break;
          case "skill":
            await sequelize.models.Skill.sync({
              force: false,
              schema: schemaName // Explicitly set schema
            })   
            break;
          case "resource_skill_timeline":
            await sequelize.models.ResourceSkillTimeline.sync({
              force: false,
              schema: schemaName // Explicitly set schema
            })   
            break;  
          case "resource_skill_history":
            await sequelize.models.ResourceSkillHistory.sync({
              force: false,
              schema: schemaName // Explicitly set schema
            })   
            break;    
          default:
            throw new Error(`Table model ${tableName} not found`);
        }
        console.log(`Table ${tableName} created in schema: ${schemaName}`);
      } else {
        console.log(
          `Table ${tableName} already exists in schema: ${schemaName}`
        );
      }
    } else {
      // Create all tables in the specified schema
      await sequelize.sync({ 
        force: false,
        schema: schemaName // Explicitly set schema for all tables
      });
      console.log(`All tables created in schema: ${schemaName}`);
    }

    return true;
  } catch (err) {
    console.error(`Error creating tables in schema ${schemaName}:`, err);
    return false;
  }
}

/**
 * Checks if a schema exists in the database
 *
 * @param sequelize - The Sequelize instance
 * @param schemaName - The name of the schema to check
 * @returns Promise<boolean> - True if schema exists, false otherwise
 */
async function checkSchemaExists(
  sequelize: any,
  schemaName: string
): Promise<boolean> {
  try {
    const result = await sequelize.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = :schemaName
      )`,
      {
        replacements: { schemaName },
        type: "SELECT",
        plain: true,
      }
    );

    return result ? result.exists === true : false;
  } catch (error) {
    console.error("Error checking schema existence:", error);
    return false;
  }
}

/**
 * Checks if a table exists in the specified schema
 *
 * @param sequelize - The Sequelize instance
 * @param schemaName - The name of the schema
 * @param tableName - The name of the table to check
 * @returns Promise<boolean> - True if table exists, false otherwise
 */
async function checkTableExists(
  sequelize: any,
  schemaName: string,
  tableName: string
): Promise<boolean> {
  try {
    const result = await sequelize.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = :schemaName
        AND table_name = :tableName
      )`,
      {
        replacements: { schemaName, tableName },
        type: "SELECT",
        plain: true,
      }
    );

    return result ? result.exists === true : false;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
}