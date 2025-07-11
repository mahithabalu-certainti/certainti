import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ProjectResourceTimelineAttributes {
  rid?: string;
  account_rid: string;
  r_number?: string;
  event_name: string;
  event_status: string;
  event_datetime?: Date;
  event_type: string;
  entity_rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;
}

interface ProjectResourceTimelineCreationAttributes
  extends Optional<ProjectResourceTimelineAttributes, "rid"> {}

export class ProjectResourceTimeline
  extends Model<
    ProjectResourceTimelineAttributes,
    ProjectResourceTimelineCreationAttributes
  >
  implements ProjectResourceTimelineAttributes
{
  public rid?: string;
  public account_rid!: string;
  public r_number?: string;
  public event_name!: string;
  public event_status!: string;
  public event_datetime?: Date;
  public event_type!: string;
  public entity_rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return ProjectResourceTimeline.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
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
        created_by: { type: DataTypes.STRING, allowNull: false },
        modified_by: { type: DataTypes.STRING },
        created_datetime: { type: DataTypes.DATE, allowNull: false },
        modified_datetime: { type: DataTypes.DATE },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project_resource_timeline",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupProjectResourceTimelineSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_timeline_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project_resource_timeline
        ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_RESOURCE_TIMELINE}-' || LPAD(nextval('"${schemaName}".project_resource_timeline_seq')::text, 10, '0')`);

    console.log("Project sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project sequence:", error);
  }
}
