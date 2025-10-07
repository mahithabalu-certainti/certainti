import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

export interface NotesTimelineAttributes {
  rid: string;
  r_number?: string;

  created_by: string;
  modified_by?: string | null;

  notes_rid : string
  document_name: string;
  title : string
  notes_owner : string
  descriptions? : string | null

  attach_to: string;
  attachment_level: string;
  
  event_type: string;
  event_status: string;
  event_name?: string | null;
  event_datetime: Date;
}

interface NotesTimelineCreationAttributes
  extends Optional<NotesTimelineAttributes, "rid"> {}

export class NotesTimeline
  extends Model<NotesTimelineAttributes, NotesTimelineCreationAttributes>
  implements NotesTimelineAttributes
{
  public rid!: string;
  public r_number?: string;

  public created_by!: string;
  public modified_by?: string | null;

  public document_name!: string;
  public notes_rid!: string;
  public title! : string
  public notes_owner! : string
  public descriptions? : string | null

  public attach_to!: string;
  public attachment_level!: string;
  
  public event_type!: string;
  public event_status!: string;
  public event_name?: string | null;
  public event_datetime!: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = NotesTimeline.init(
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
        document_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        notes_rid: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        notes_owner: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        descriptions: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        attach_to: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attachment_level: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        event_status: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        event_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "notes_timeline",
        timestamps: false,
        underscored: true,
      }
    );

    return model;
  }
}

export async function setupNotesTimelineSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".notes_timeline_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".notes_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.NOTES_TIMELINE}-' || LPAD(nextval('"${schemaName}".notes_timeline_seq')::text, 10, '0')`);

    console.log("NotesTimeline sequence setup complete");
  } catch (error) {
    console.error("Error setting up NotesTimeline sequence:", error);
  }
}