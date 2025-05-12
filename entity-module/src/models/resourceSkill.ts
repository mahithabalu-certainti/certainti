import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { Resources } from "./resource";
import { Skill } from "./skill";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceSkillAttributes  {
 rid: string,
 r_number?: string,
 eid?: string,
 account_rid: string,
 resource_type: string,
 resource_rid: string,
 resource_number: string,
 resource_ref_id: string,
 status?: string, 
 skill_type_rid: string,
 skill_subtype_rid: string,
 skill_type_name?: string,
 skill_subtype_name?: string,
 skill_details?: string,             
 start_date?: Date | null,
 skill_description?: string,     
 skill_level: string,         
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
  resource_ref_id!: string;
  status?: string;
  skill_type_rid!: string;
  skill_subtype_rid!: string;
  skill_details?: string;
  start_date?: Date;
  skill_description?: string;
  skill_level!: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize,schemaName: string) {
    ResourceSkill.init(
      {
       rid: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
       },
       r_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       eid: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       account_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       resource_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       resource_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       resource_number: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       start_date: {
        type: DataTypes.DATE,
        allowNull: true,
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
       resource_ref_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       status: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "active",
       },
       skill_type_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       skill_subtype_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       skill_details: {
        type: DataTypes.STRING(2000),
        allowNull: true,
       },
       created_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       created_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       modified_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkill",
        tableName: "resource_skill",
        timestamps: false,
        hooks: {
          beforeCreate: async (resourceSkill: ResourceSkill) => {
            // Generate r_number if not provided
            if (!resourceSkill.r_number) {              
              resourceSkill.r_number = `${R_NUMBER_PREFIX.RESOURCE_SKILL} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            }
          }
        }
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
