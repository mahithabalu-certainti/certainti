import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceSkillHistoryAttributes  {
 rid: string,
 r_number?: string,
 resource_skill_rid: string,
 attribute_name: string,
 old_value?: string,
 new_value: string
 modified_datetime?: Date,
 modified_by: string,
}

interface ResourceSkillHistoryCreationAttributes
  extends Optional<ResourceSkillHistoryAttributes, "rid"> {}

export class ResourceSkillHistory extends Model<ResourceSkillHistoryAttributes, ResourceSkillHistoryCreationAttributes> implements ResourceSkillHistoryAttributes 
{
    rid!: string;
    r_number?: string;
    resource_skill_rid!: string;
    attribute_name!: string;
    old_value?: string;
    new_value!: string;
    modified_datetime?: Date;
    modified_by!: string;

  static initialize(sequelize: Sequelize,schemaName:string) {
    ResourceSkillHistory.init(
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
       resource_skill_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       attribute_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       old_value: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       new_value: {
         type: DataTypes.STRING(255),
         allowNull: false,
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_by: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkillHistory",
        tableName: "resource_skill_history",
        timestamps: false,
        hooks: {
          beforeCreate: async (resourceSkillHistory: ResourceSkillHistory) => {
            console.log("line 80 : ");
            // Generate r_number if not provided
            if (!resourceSkillHistory.r_number) {
              resourceSkillHistory.r_number = `${R_NUMBER_PREFIX.RESOURCE_SKILL_HISTORY} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            }
          }
        }
      }
    );
    return ResourceSkillHistory;
  }
}
