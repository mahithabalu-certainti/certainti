import { Model, DataTypes,Sequelize, Optional } from "sequelize";
import { Resources } from "./resource";
import { Skill } from "./skill";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceSkillAttributes  {
 rid: string,
 r_number?: string,
 eid?: string,
 account_rid: string,
 resource_type: string,
 resource_rid: string,
 resource_number: string,
 resource_code: string,
 status?: string, 
 skill_type_rid: string,
 skill_subtype_rid: string,
 skill_type_name?: string,
 skill_subtype_name?: string,
 skill_details?: string,             
 start_date?: Date | null,
 skill_description?: string,     
 skill_level: string,  
 skill_type_others?: string,
 skill_subtype_others?: string,
 comments?: string,       
 created_datetime?: Date,
 modified_datetime?: Date,
 created_by?: string,
 modified_by?: string,
}

interface ResourceSkillCreationAttributes
  extends Optional<ResourceSkillAttributes, "rid"> {}

export class ResourceSkill extends Model<ResourceSkillAttributes, ResourceSkillCreationAttributes> implements ResourceSkillAttributes 
{
  rid!: string;
  r_number?: string;
  eid?: string;
  account_rid!: string;
  resource_type!: string;
  resource_rid!: string;
  resource_number!: string;
  resource_code!: string;
  status?: string;
  skill_type_rid!: string;
  skill_subtype_rid!: string;
  skill_details?: string;
  start_date?: Date | null;
  skill_description?: string;
  skill_level!: string;
  skill_type_others?: string;
  skill_subtype_others?: string;
  comments?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize,schemaName: string) {
    ResourceSkill.init(
      {
       rid: {
        type: DataTypes.STRING(50),
        defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        primaryKey: true,
       },
       r_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
       },
       eid: {
        type: DataTypes.STRING(120),
        allowNull: true,
       },
       created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
       },
       modified_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
       },
       created_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true
       },
       account_rid: {
        type: DataTypes.STRING(50),
        allowNull: false,
       },
       resource_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       resource_rid: {
        type: DataTypes.STRING(50),
        allowNull: false,
       },
       resource_number: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true
        }
       },
       skill_description: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       skill_level: {
       type: DataTypes.STRING(255),
       allowNull: true,
       defaultValue: "Beginner", 
       },
       skill_type_others: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       skill_subtype_others: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       resource_code: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       status: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "active",
       },
       skill_type_rid: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       skill_subtype_rid: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       skill_details: {
        type: DataTypes.TEXT,
        allowNull: true,
       },
       comments: {
        type: DataTypes.TEXT,
        allowNull: true,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkill",
        tableName: "resource_skill",
        timestamps: false,
      }
    );

    // ResourceSkill model
    ResourceSkill.belongsTo(Resources, {
      foreignKey: "resource_rid",
      targetKey: "rid",
    });

    // Resource model
    Resources.hasMany(ResourceSkill, {
      foreignKey: "resource_rid",
      sourceKey: "rid",
    });

    // Skill model
    // ResourceSkill.belongsTo(Skill,{
    //   foreignKey: "skill_rid",
    //   targetKey: "rid",
    // });

    // Skill.hasMany(ResourceSkill, {
    //   foreignKey: "skill_rid",
    //   sourceKey: "rid",
    // });
    return ResourceSkill;
  }
}


export async function setupResourceSkillSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_skill
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_SKILL}-' || LPAD(nextval('"${schemaName}".resource_skill_seq')::text, 10, '0')`);
    
    console.log('Resource skill sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource skill sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}