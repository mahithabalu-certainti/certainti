import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface AdminCheckListItemAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  checklist_template_rid: string;
  checklist_item_name: string;
  description?: string;
  status_rid?: string;
}

export interface AdminCheckListItemCreationAttributes
  extends Optional<AdminCheckListItemAttributes, "rid"> {}

export class AdminCheckListItem
  extends Model<AdminCheckListItemAttributes, AdminCheckListItemCreationAttributes>
  implements AdminCheckListItemAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public checklist_template_rid!: string;
  public checklist_item_name!: string;
  public description?: string;
  public status_rid?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return AdminCheckListItem.init(
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
        checklist_template_rid: { type: DataTypes.STRING(50), allowNull: false },
        checklist_item_name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.STRING(2000), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "checklist_template_items",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
