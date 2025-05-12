import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

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
            // Generate r_number if not provided
            if (!resourceCostHistory.r_number) {
              // Get the latest cost history number and increment it
            const latestAccount = await ResourceCostHistory.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }              
              resourceCostHistory.r_number = `${R_NUMBER_PREFIX.RESOURCE_COST_HISTORY} ${nextNumber}`;
            }
          }
        }
      }
    );
    return ResourceCostHistory;
  }
}
