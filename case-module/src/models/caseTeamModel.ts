import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseTeamAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  case_rid: string;
  account_rid: string;
  role_rid: string;
  user_rid: string;
  effective_startdate: Date;
  effective_enddate?: Date;
  is_primary: boolean;
  status_rid: string;
}

export interface CaseTeamCreationAttributes
  extends Optional<CaseTeamAttributes, "rid"> {}

export class CaseTeam
  extends Model<CaseTeamAttributes, CaseTeamCreationAttributes>
  implements CaseTeamAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public case_rid!: string;
  public account_rid!: string;
  public role_rid!: string;
  public user_rid!: string;
  public effective_startdate!: Date;
  public effective_enddate?: Date;
  public is_primary!: boolean;
  public status_rid!: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseTeam.init(
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
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false, 
          defaultValue: DataTypes.NOW
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        case_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        role_rid: { type: DataTypes.STRING(50), allowNull: false },
        user_rid: { type: DataTypes.STRING(50), allowNull: false },
        effective_startdate: { type: DataTypes.DATEONLY, allowNull: false },
        effective_enddate: { type: DataTypes.DATEONLY, allowNull: true },
        is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_team",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

