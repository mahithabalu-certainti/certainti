import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface OtpAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;

  email: string;
  account_rid: string;
  interaction_rid: string;
  otp: string;
  is_verified: boolean;
  expires_at: Date;
}

export interface OtpCreationAttributes extends Optional<OtpAttributes, "rid"> {}

export class Otp
  extends Model<OtpAttributes, OtpCreationAttributes>
  implements OtpAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  public email!: string;
  public account_rid!: string;
  public interaction_rid!: string;
  public otp!: string;
  public is_verified!: boolean;
  public expires_at!: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return Otp.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: false },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        email: { type: DataTypes.STRING(120), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_rid: { type: DataTypes.STRING(100), allowNull: false },
        otp: { type: DataTypes.STRING(50), allowNull: false },
        is_verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        expires_at: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "otp_entries",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
