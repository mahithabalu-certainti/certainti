import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceCostHistoryAttributes  {
 rid: string,
 r_number?: string,
 resource_cost_rid: string,
 attribute_name: string,
 old_value?: string,
 new_value: string
 modified_datetime?: Date,
 modified_by?: string,
 created_datetime: Date,
 created_by: string,
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
    modified_by?: string;
    created_datetime!: Date;
    created_by!: string;

  static initialize(sequelize: Sequelize,schemaName:string) {
    ResourceCostHistory.init(
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
       created_by: {
        type: DataTypes.STRING(50),
        allowNull: false,
       },
       modified_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
       },
       created_datetime: {
        type: DataTypes.DATE,
        allowNull: false
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
     
       resource_cost_rid: {
        type: DataTypes.STRING(50),
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
       
      },
      {
        sequelize,
        schema: schemaName, // Specify the schema name here
        modelName: "ResourceCostHistory",
        tableName: "resource_cost_history",
        timestamps: false,
      }
    );
    return ResourceCostHistory;
  }
}


export async function setupResourceCostHistorySeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_history_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_cost_history
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_COST_HISTORY}-' || LPAD(nextval('"${schemaName}".resource_cost_history_seq')::text, 10, '0')`);
    
    console.log('Resource cost history sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource cost history sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}