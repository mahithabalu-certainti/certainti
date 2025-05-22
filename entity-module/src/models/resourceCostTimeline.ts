import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceCostTimelineAttributes  {
 rid: string,
 r_number?: string,
 account_rid: string,
 event_name: string,
 event_status: string,
 event_type?: string,
 entity_rid: string
 event_datetime?: Date,
 modified_datetime?: Date,
 modified_by: string,
}

interface ResourceCostTimelineCreationAttributes
  extends Optional<ResourceCostTimelineAttributes, "rid"> {}

export class ResourceCostTimeline extends Model<ResourceCostTimelineAttributes, ResourceCostTimelineCreationAttributes> implements ResourceCostTimelineAttributes 
{
  rid!: string;
 r_number?: string;
 account_rid!: string;
 event_name!: string;
 event_status!: string;
 event_type?: string;
 event_datetime?: Date;
 entity_rid!: string;
 modified_datetime?: Date;
 modified_by!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ResourceCostTimeline.init(
      {
       rid: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
       },
       r_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
       },
       account_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       event_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       event_status: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       event_type: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "Ui Handler"
       },
       entity_rid: {
         type: DataTypes.UUID,
         allowNull: false,
       },
       event_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_by: {
        type: DataTypes.STRING(),
        allowNull: false,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceCostTimeline",
        tableName: "resource_cost_timeline",
        timestamps: false,
      }
    );
    return ResourceCostTimeline; 
  }
}


export async function setupResourceCostTimelineSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_timeline_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_cost_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_COST_TIMELINE} ' || LPAD(nextval('"${schemaName}".resource_cost_timeline_seq')::text, 10, '0')`);
    
    console.log('Resource cost timeline sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource cost timeline sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
