import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceSkillTimelineAttributes  {
 rid: string,
 r_number?: string,
 account_rid: string,
 event_name: string,
 event_status: string,
 event_type?: string,
 entity_rid: string
 event_datetime?: Date,
 modified_datetime?: Date,
 modified_by?: string,
 created_datetime?: Date;
 created_by?: string;
}

interface ResourceSkillTimelineCreationAttributes
  extends Optional<ResourceSkillTimelineAttributes, "rid"> {}

export class ResourceSkillTimeline extends Model<ResourceSkillTimelineAttributes, ResourceSkillTimelineCreationAttributes> implements ResourceSkillTimelineAttributes 
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
 modified_by?: string;
 created_datetime?: Date;
 created_by!: string;

  static initialize(sequelize: Sequelize,schemaName: string) {
    ResourceSkillTimeline.init(
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
         type: DataTypes.STRING(50),
         allowNull: false,
       },
       event_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
       },
       
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkillTimeline",
        tableName: "resource_skill_timeline",
        timestamps: false,
      }
    );
    return ResourceSkillTimeline;
  }
}


export async function setupResourceSkillTimelineSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_timeline_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_skill_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_SKILL_TIMELINE}-' || LPAD(nextval('"${schemaName}".resource_skill_timeline_seq')::text, 10, '0')`);
    
    console.log('Resource skill timeline sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource skill timeline sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
