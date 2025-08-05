import { Model, DataTypes,Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { Resources } from "./resource";

interface ResourcesHistoryAttributes {
  rid?: string;
  resource_rid: string;
  r_number?: string;
  attribute_name: string;
  old_value?: string;
  new_value: string;
  created_by?: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_datetime?: Date;
}

interface ResourcesHistoryCreationAttributes
  extends Optional<ResourcesHistoryAttributes, "rid"> {}

export class ResourcesHistory
  extends Model<ResourcesHistoryAttributes, ResourcesHistoryCreationAttributes>
  implements ResourcesHistoryAttributes
{
  public rid?: string;
  public resource_rid!: string;
  public r_number?: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value!: string;
  public modified_datetime?: Date;
  public modified_by?: string;
  public created_datetime?: Date;
  public created_by?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ResourcesHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          allowNull: false,
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
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        resource_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
        new_value: {
          type: DataTypes.STRING(1000),
          allowNull: false,
        }, 
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "resources_history",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("modified_datetime", new Date());
            resources.setDataValue("created_datetime", new Date());
          },
        },
      }
    );


    return ResourcesHistory;
  }
}


export async function setupResourceHistorySeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_history_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resources_history
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_HISTORY}-' || LPAD(nextval('"${schemaName}".resource_history_seq')::text, 10, '0')`);
    
    console.log('Resource history sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource history sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}