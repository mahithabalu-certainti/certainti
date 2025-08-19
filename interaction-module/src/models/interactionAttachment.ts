import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MAIN_SCHEMA_NAME, ENV_PREFIX } from "../utils/constants";

interface InteractionAttachmentAttributes {
  rid: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  interaction_rid: string;
  interaction_response_rid?:string;
  interaction_version?:number;
  interaction_item_rid?: string;
  attachment_name: string;
  attachment_type?: string;
  attachment_size?: number;
  attachment_url:string

}

type InteractionAttachmentCreationAttributes = Optional<InteractionAttachmentAttributes, "rid">;

export class InteractionAttachment extends Model<InteractionAttachmentAttributes, InteractionAttachmentCreationAttributes> implements InteractionAttachmentAttributes {
  public rid!: string;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public interaction_rid!: string;
  public interaction_response_rid?: string;
  public interaction_version?: number;
  public interaction_item_rid?: string;
  public attachment_name!: string;
  public attachment_type?: string;
  public attachment_size?: number;
  public attachment_url!: string;
  

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return InteractionAttachment.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'D001-' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: true },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        interaction_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_response_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_item_rid: { type: DataTypes.TEXT, allowNull: true },
        interaction_version: { type: DataTypes.INTEGER, allowNull: false },
        attachment_url: { type: DataTypes.STRING(255), allowNull: false },
        attachment_name: { type: DataTypes.STRING(255), allowNull: false },
        attachment_type: { type: DataTypes.STRING(50), allowNull: true },
        attachment_size: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_attachments",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
