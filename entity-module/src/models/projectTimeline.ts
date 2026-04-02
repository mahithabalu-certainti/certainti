import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constants";
import { Project } from "./project";
import AccountDetails from "./accountDetails";
import { ProjectFiscal } from "./projectFiscal";

interface ProjectTimelineAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  document_rid?: string;
  entity_rid: string;
  event_name: string;
  event_type?: string;
  event_type_rid?: string;
  event_status?: string;
  event_datetime?: Date;
  project_rid?: string;
  entity_name?: string;
  created_by_name?: string;
  descriptions?: string;
  source_record_count?: number;
}

interface ProjectTimelineCreationAttributes
  extends Optional<ProjectTimelineAttributes, "rid"> {}

export class ProjectTimeline
  extends Model<ProjectTimelineAttributes, ProjectTimelineCreationAttributes>
  implements ProjectTimelineAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public document_rid?: string;
  public entity_rid!: string;
  public event_name!: string;
  public event_type?: string;
  public event_type_rid?: string;
  public event_status?: string;
  public event_datetime?: Date;
  public project_rid?: string;
  public entity_name?: string;
  public created_by_name?: string;
  public descriptions?: string;
  public source_record_count?: number;

  static initialize(sequelize: Sequelize, schemaName: string) {
     const model = ProjectTimeline.init(
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
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        document_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
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
          allowNull: true,
        },
        event_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        event_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        project_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        entity_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        created_by_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        descriptions: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        source_record_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project_timeline",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("event_datetime", new Date());
          },
        },
      }
    );
    
    ProjectTimeline.belongsTo(AccountDetails, {
      foreignKey: 'account_rid',
      targetKey: 'account_rid',
      as: 'project_timeline_account',
    });

    ProjectTimeline.belongsTo(ProjectFiscal, {
      foreignKey: 'entity_rid',
      targetKey: 'rid',
      as: 'ProjectFiscal',
    });
    
      return model;
  } 
}

export async function setupProjectTimelineSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_timeline_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".project_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_TIMELINE}-' || LPAD(nextval('"${schemaName}".project_timeline_seq')::text, 10, '0')`);
    
    console.log('Project timeline sequence setup complete');
  } catch (error) {
    console.error('Error setting up Project timeline sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}