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
              resourceCostHistory.r_number = `${R_NUMBER_PREFIX.RESOURCE_COST_HISTORY} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            }
          }
        }
      }
    );
    return ResourceCostHistory;
  }
}
