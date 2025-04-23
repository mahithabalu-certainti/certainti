import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

interface ResourceCostHistoryAttributes  {
 rid: string,
 r_number?: string,
 resource_cost_rid: string,
 attribute_name: string,
 old_value?: string,
 new_value: string
 modified_datetime?: Date,
 modified_by: string,
}

interface ResourceCostHistoryCreationAttributes
  extends Optional<ResourceCostHistoryAttributes, "rid"> {}

export class ResourceCostHistory extends Model<ResourceCostHistoryAttributes, ResourceCostHistoryCreationAttributes> implements ResourceCostHistoryAttributes 
{
    rid!: string;
    r_number?: string;
    resource_cost_rid!: string;
    attribute_name!: string;
    old_value?: string;
    new_value!: string;
    modified_datetime?: Date;
    modified_by!: string;

  static initialize(sequelize: Sequelize,schemaName:string) {
    ResourceCostHistory.init(
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
       resource_cost_rid: {
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
        schema: schemaName, // Specify the schema name here
        modelName: "ResourceCostHistory",
        tableName: "resource_cost_history",
        timestamps: false,
        hooks: {
          beforeCreate: async (resourceCostHistory: ResourceCostHistory) => {
            console.log("line 80 : ");
            // Generate r_number if not provided
            if (!resourceCostHistory.r_number) {
              // Get the latest resource cost history to determine the next number
              const latestResourceCostHistory = await ResourceCostHistory.findOne({
                order: [['modified_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestResourceCostHistory && latestResourceCostHistory.r_number) {
                const match = latestResourceCostHistory.r_number.match(/RCH(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., RCH00001)
              resourceCostHistory.r_number = `RCH${nextNumber.toString().padStart(5, '0')}`;
            }
          }
        }
      }
    );
  }
}
