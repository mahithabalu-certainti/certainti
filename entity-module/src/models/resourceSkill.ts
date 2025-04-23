import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { Resources } from "./resource";
import { Skill } from "./skill";

interface ResourceSkillAttributes  {
 rid: string,
 r_number?: string,
 eid?: string,
 account_rid: string,
 resource_type: string,
 resource_rid: string,
 resource_ref_id: string, 
 resource_desc: string,
 skill_rid: string,
 start_date?: Date,
 skill_description?: string,
 skill_level: string,
 status?: string,
 years_of_experience: number,
 created_datetime?: Date,
 modified_datetime?: Date,
 created_by?: string,
 modified_by?: string,
 technical_weightage: number
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
  resource_ref_id!: string;
  resource_desc!: string;
  status?: string; 
  skill_rid!: string;
  start_date?: Date;
  skill_description?: string;
  skill_level!: string;
  years_of_experience!: number;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
  technical_weightage!: number;

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
       resource_desc : {
         type: DataTypes.STRING(255),
         allowNull: true,
       },
       skill_rid: {
        type: DataTypes.UUID,
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
       years_of_experience: {
         type: DataTypes.DECIMAL(10, 1),
         allowNull: true,
       },
       resource_ref_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       technical_weightage: {
         type: DataTypes.DECIMAL(10, 2),
         allowNull: true,
       },
       status: {
        type: DataTypes.STRING(255),
        defaultValue: "active",
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
              // Get the latest resource skill to determine the next number
              const latestResourceSkill = await ResourceSkill.findOne({
                order: [['created_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestResourceSkill && latestResourceSkill.r_number) {
                const match = latestResourceSkill.r_number.match(/RSK(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., RSK00001)
              resourceSkill.r_number = `RSK${nextNumber.toString().padStart(5, '0')}`;
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
    ResourceSkill.belongsTo(Skill,{
      foreignKey: "skill_rid",
      targetKey: "rid",
    });

    Skill.hasMany(ResourceSkill, {
      foreignKey: "skill_rid",
      sourceKey: "rid",
    });
  }
}
