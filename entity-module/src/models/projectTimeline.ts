import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constants";
import { Project } from "./project";
import AccountDetails from "./accountDetails";

interface ProjectTimelineAttributes {
  rid?: string;
  account_rid: string;
  r_number?: string;
  event_name: string;
  event_status: string;
  event_datetime?: Date;
  event_type: string;
  entity_rid: string;
  modified_by?: string;
  created_by?:string
}

interface ProjectTimelineCreationAttributes
  extends Optional<ProjectTimelineAttributes, "rid"> {}

export class ProjectTimeline
  extends Model<ProjectTimelineAttributes, ProjectTimelineCreationAttributes>
  implements ProjectTimelineAttributes
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
  public created_by?: string;

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
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
         event_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
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

      ProjectTimeline.belongsTo(Project, {
        foreignKey: 'entity_rid',
        targetKey: 'rid',
        as: 'project',
      });

      Project.hasMany(ProjectTimeline, {
        foreignKey: 'entity_rid',
        sourceKey: 'rid',
        as: 'ProjectTimeline',
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