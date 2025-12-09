import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface JurisdictionConfigAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  config_json:JSON
  effective_start_date?: Date;
  effective_end_date?: Date;
  status_rid: string;
  credit_config_group_rid: string;
  
}

export interface JurisdictionConfigCreationAttributes
  extends Optional<JurisdictionConfigAttributes, "rid"> {}

export class JurisdictionConfig
  extends Model<JurisdictionConfigAttributes, JurisdictionConfigCreationAttributes>
  implements JurisdictionConfigAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public config_json!: JSON;
  public effective_start_date!: Date;
  public effective_end_date!: Date;
  public status_rid!: string;
  public credit_config_group_rid!: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return JurisdictionConfig.init(
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
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false, 
          defaultValue: DataTypes.NOW
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        config_json: { type: DataTypes.JSONB, allowNull: false },
        effective_start_date: { type: DataTypes.DATE, allowNull: false },
        effective_end_date: { type: DataTypes.DATE, allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
        credit_config_group_rid: { type: DataTypes.STRING(50), allowNull: false }
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "rd_credit_parameter_values",
        timestamps: false,
        underscored: true,
      }
    );
  }
}