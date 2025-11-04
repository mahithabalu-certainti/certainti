import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface AdminChecklistAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  checklist_name: string;
  checklist_description?: string;
  effective_startdate?: Date;
  effective_enddate?: Date;
  case_teammember_role_rid?: string;
  status_rid?: string;
  task_level?: string;
  assigned_to?: string;
}

export interface AdminChecklistCreationAttributes
  extends Optional<AdminChecklistAttributes, "rid"> {}

export class AdminChecklist
  extends Model<AdminChecklistAttributes, AdminChecklistCreationAttributes>
  implements AdminChecklistAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public checklist_name!: string;
  public checklist_description?: string;
  public effective_startdate?: Date;
  public effective_enddate?: Date;
  public case_teammember_role_rid?: string;
  public status_rid?: string;
  public task_level?: string;
  public assigned_to?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return AdminChecklist.init(
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
        checklist_name: { type: DataTypes.STRING(255), allowNull: false },
        checklist_description: { type: DataTypes.STRING(2000), allowNull: true },
        effective_startdate: { type: DataTypes.DATE, allowNull: true },
        effective_enddate: { type: DataTypes.DATE, allowNull: true },
        case_teammember_role_rid: { type: DataTypes.STRING(50), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        task_level: { type: DataTypes.STRING(50), allowNull: true },
        assigned_to: { type: DataTypes.STRING(50), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "checklist_template",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

