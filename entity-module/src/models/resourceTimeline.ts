import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ResourcesTimelineAttributes {
  rid?: string;
  account_rid: string;
  r_number?: string;
  event_name: string;
  event_status: string;
  event_datetime?: Date;
  event_type: string;
  entity_rid: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
}

interface ResourcesTimelineCreationAttributes
  extends Optional<ResourcesTimelineAttributes, "rid"> {}

export class ResourcesTimeline
  extends Model<
    ResourcesTimelineAttributes,
    ResourcesTimelineCreationAttributes
  >
  implements ResourcesTimelineAttributes
{
  public rid?: string;
  public account_rid!: string;
  public r_number?: string;
  public event_name!: string;
  public event_status!: string;
  public event_datetime?: Date;
  public event_type!: string;
  public entity_rid!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;


  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = ResourcesTimeline.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true,
        },
         created_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
         created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        entity_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        event_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_status: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "resources_timeline",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("event_datetime", new Date());
          },
        },
      }
    );
    return model;
  }
}


export async function setupResourceTimelineSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_timeline_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resources_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_TIMELINE}-' || LPAD(nextval('"${schemaName}".resource_timeline_seq')::text, 10, '0')`);
    
    console.log('Resource timeline sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource timeline sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
