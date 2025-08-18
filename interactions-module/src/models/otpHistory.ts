import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { IOtpHistoryStatus } from "../utils/types";

export interface OtpHistoryAttributes {
  rid: string;
  created_by: string;
  created_datetime: Date;

  otp_entries_rid: string;
  email: string;
  account_rid: string;
  interaction_rid: string;
  otp: string;

  status: IOtpHistoryStatus;
  attempt_number: number;
  error_message?: string | null;
}

export interface OtpHistoryCreationAttributes
  extends Optional<OtpHistoryAttributes, "rid" | "error_message"> {}

export class OtpHistory
  extends Model<OtpHistoryAttributes, OtpHistoryCreationAttributes>
  implements OtpHistoryAttributes
{
  public rid!: string;
  public created_by!: string;
  public created_datetime!: Date;

  public otp_entries_rid!: string;
  public email!: string;
  public account_rid!: string;
  public interaction_rid!: string;
  public otp!: string;

  public status!: IOtpHistoryStatus;
  public attempt_number!: number;
  public error_message?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return OtpHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        created_datetime: { type: DataTypes.DATE, allowNull: false },

        otp_entries_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        email: { type: DataTypes.STRING(120), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_rid: { type: DataTypes.STRING(100), allowNull: false },
        otp: { type: DataTypes.STRING(100), allowNull: false },

        status: {
          type: DataTypes.ENUM(
            "SENT",
            "SEND_FAILED",
            "VERIFIED",
            "VERIFICATION_FAILED",
            "RESENT"
          ),
          allowNull: false,
        },
        attempt_number: { type: DataTypes.INTEGER, allowNull: false },
        error_message: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "otp_entries_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
