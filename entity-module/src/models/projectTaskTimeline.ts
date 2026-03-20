import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  ENV_PREFIX,
  R_NUMBER_PREFIX,
} from "../utils/constants";
import { ProjectTask } from "./projectTask";
import AccountDetails from "./accountDetails";

interface ProjectTaskTimelineAttributes {
  rid?: string;
  account_rid: string;
  r_number?: string;
  event_name: string;
  event_status: string;
  event_datetime?: Date;
  created_datetime?: Date;
  modified_datetime?: Date | null;
  event_type: string;
  entity_rid: string;
  modified_by?: string;
  created_by?: string;
  document_rid?: string | null;
  event_type_rid?: string | null;
  project_rid?: string | null;
  entity_name?: string | null;
  created_by_name?: string | null;
  descriptions?: string | null;
  source_record_count?: number | null;
}

interface ProjectTaskTimelineCreationAttributes
  extends Optional<ProjectTaskTimelineAttributes, "rid"> {}

export class ProjectTaskTimeline
  extends Model<
    ProjectTaskTimelineAttributes,
    ProjectTaskTimelineCreationAttributes
  >
  implements ProjectTaskTimelineAttributes
{
  public rid?: string;
  public account_rid!: string;
  public r_number?: string;
  public event_name!: string;
  public event_status!: string;
  public event_datetime?: Date;
  public created_datetime?: Date;
  public modified_datetime?: Date | null;
  public event_type!: string;
  public entity_rid!: string;
  public modified_by?: string;
  public created_by?: string;
  public document_rid?: string | null;
  public event_type_rid?: string | null;
  public project_rid?: string | null;
  public entity_name?: string | null;
  public created_by_name?: string | null;
  public descriptions?: string | null;
  public source_record_count?: number | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = ProjectTaskTimeline.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
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
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
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
        document_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        event_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
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

    ProjectTaskTimeline.belongsTo(ProjectTask, {
      foreignKey: "entity_rid",
      targetKey: "rid",
      as: "project_task_timeline_project_task",
    });

    ProjectTaskTimeline.belongsTo(AccountDetails, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "project_task_timeline_account",
    });

    ProjectTask.hasMany(ProjectTaskTimeline, {
      foreignKey: "entity_rid",
      sourceKey: "rid",
      as: "ProjectTimeline",
    });

    return model;
  }
}

export async function setupProjectTaskTimelineSeq(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_task_timeline_seq START 1`
    );

    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".project_task_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_TASK_TIMELINE}-' || LPAD(nextval('"${schemaName}".project_task_timeline_seq')::text, 10, '0')`);

    console.log("Project task timeline sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project task timeline sequence:", error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
