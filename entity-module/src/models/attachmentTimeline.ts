import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

export interface AttachmentTimelineAttributes {
  rid: string;
  r_number?: string;

  created_by: string;
  modified_by?: string | null;

  document_rid: string;
  document_name: string;
  document_category_rid: string;
  document_type_rid: string;

  attach_to: string;
  attachment_level: string;
  
  event_type: string;
  event_status: string;
  event_name?: string | null;
  event_datetime: Date;
}

interface AttachmentTimelineCreationAttributes
  extends Optional<AttachmentTimelineAttributes, "rid"> {}

export class AttachmentTimeline
  extends Model<AttachmentTimelineAttributes, AttachmentTimelineCreationAttributes>
  implements AttachmentTimelineAttributes
{
  public rid!: string;
  r_number?: string;

  public created_by!: string;
  public modified_by?: string | null;

  public document_rid!: string;
  public document_name!: string;
  public document_category_rid!: string;
  public document_type_rid!: string;

  public attach_to!: string;
  public attachment_level!: string;
  
  public event_type!: string;
  public event_status!: string;
  public event_name?: string | null;
  public event_datetime!: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = AttachmentTimeline.init(
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
        document_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        document_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        document_category_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        document_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
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
        tableName: "attachment_timeline",
        timestamps: false,
        underscored: true,
      }
    );

    return model;
  }
}

export async function setupAttachmentTimelineSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".attachment_timeline_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".attachment_timeline
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.ATTACHMENT_TIMELINE}-' || LPAD(nextval('"${schemaName}".attachment_timeline_seq')::text, 10, '0')`);

    console.log("AttachmentTimeline sequence setup complete");
  } catch (error) {
    console.error("Error setting up AttachmentTimeline sequence:", error);
  }
}