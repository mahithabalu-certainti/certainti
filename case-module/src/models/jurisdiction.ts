import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";


export interface JurisdictionAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  case_rid: string;
  is_federal_level: boolean;
  is_state_level: boolean;
  states?: string[];
}

export interface JurisdictionCreationAttributes
  extends Optional<JurisdictionAttributes, "rid"> { }

export class Jurisdiction
  extends Model<JurisdictionAttributes, JurisdictionCreationAttributes>
  implements JurisdictionAttributes {
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public case_rid!: string;
  public is_federal_level!: boolean;
  public is_state_level!: boolean;
  public states?: string[];

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return Jurisdiction.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_rid: { type: DataTypes.STRING(50), allowNull: false },
        is_federal_level: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        is_state_level: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        states: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
      },
      {
        sequelize,
        schema: `${schemaName}`,
        tableName: "jurisdictions",
        timestamps: false,
        underscored: true,
        indexes: [
          { name: "idx_jurisdictions_account_rid", fields: ["account_rid"] },
          { name: "idx_jurisdictions_case_rid", fields: ["case_rid"] },
        ],
      }
    );
  }
}
