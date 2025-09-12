import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface SendEmailInfoAttributes {
  rid: string;
  interaction_rid?: string;
  account_rid?: string;
  account_rnumber?: string;
  email?: string;
  name?: string;
  project_fiscal_rid?: string;
  user_rid?: string;
  is_email_send?: boolean;
  created_datetime?: Date;
  modified_datetime?: Date;
}

export interface SendEmailInfoCreationAttributes
  extends Optional<SendEmailInfoAttributes, "rid"> {}

export class SendEmailInfo
  extends Model<SendEmailInfoAttributes, SendEmailInfoCreationAttributes>
  implements SendEmailInfoAttributes
{
  public rid!: string;
  public interaction_rid?: string;
  public account_rid?: string;
  public account_rnumber?: string;
  public email?: string;
  public name?: string;
  public project_fiscal_rid?: string;
  public user_rid?: string;
  public is_email_send?: boolean;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return SendEmailInfo.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: true },
        account_rnumber: { type: DataTypes.STRING(50), allowNull: true },
        email: { type: DataTypes.STRING(50), allowNull: true },
        name: { type: DataTypes.STRING(50), allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        user_rid: { type: DataTypes.STRING(50), allowNull: true },
        is_email_send: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        created_datetime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "send_email_info",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
