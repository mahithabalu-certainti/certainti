import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ResourceSkill } from "./resourceSkill";

interface SkillAttributes  {
 rid: string,
 r_number?: string,
 eid?: string,
 skill_type?: string,
 skill_name: string,
 skill_description?: string,
 created_datetime?: Date,
 modified_datetime?: Date,
 created_by?: string,
 modified_by?: string,
}

interface SkillCreationAttributes
  extends Optional<SkillAttributes, "rid"> {}

export class Skill extends Model<SkillAttributes, SkillCreationAttributes> implements SkillAttributes 
{
  rid!: string;
  r_number?: string;
  eid?: string;
  skill_type?: string;
  skill_name!: string;
  skill_description?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
  

  static initialize(sequelize: Sequelize,schemaName: string) {
    Skill.init(
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
       skill_type: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       skill_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       skill_description: {
        type: DataTypes.STRING(255),
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
        schema: schemaName, // Replace with your schema name
        modelName: "Skill",
        tableName: "skill",
        timestamps: false,
        hooks: {
          beforeCreate: async (skill: Skill) => {
            // Generate r_number if not provided
            if (!skill.r_number) {
              // Get the latest skill to determine the next number
              const latestSkill = await Skill.findOne({
                order: [['created_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestSkill && latestSkill.r_number) {
                const match = latestSkill.r_number.match(/SK(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., SK00001)
              skill.r_number = `SK${nextNumber.toString().padStart(5, '0')}`;
            }
          }
        }
      }
    );
}
}
