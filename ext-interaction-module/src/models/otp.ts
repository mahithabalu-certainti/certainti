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
  otp_attempt_count: number;
  otp_block_until?: Date | null;
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

  public otp_attempt_count!: number;
  public otp_block_until?: Date | null;;

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
        otp: { type: DataTypes.STRING(100), allowNull: false },
        is_verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        otp_attempt_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        otp_block_until: {
          type: DataTypes.DATE,
          allowNull: true,
        },
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
