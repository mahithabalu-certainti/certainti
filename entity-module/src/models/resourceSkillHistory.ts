import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

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
    return ResourceSkillHistory.init(
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
              // Get the latest resource skill history to determine the next number
              const latestResourceSkillHistory = await ResourceSkillHistory.findOne({
                order: [['modified_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestResourceSkillHistory && latestResourceSkillHistory.r_number) {
                const match = latestResourceSkillHistory.r_number.match(/RSH(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., RCH00001)
              resourceSkillHistory.r_number = `RSH${nextNumber.toString().padStart(5, '0')}`;
            }
          }
        }
      }
    );
  }
}
