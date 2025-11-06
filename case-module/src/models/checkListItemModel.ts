import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CheckListItemAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  case_checklist_rid: string;
  checklist_item_name: string;
  checklist_item_description?: string;
  status_rid?: string;
}

export interface CheckListItemCreationAttributes
  extends Optional<CheckListItemAttributes, "rid"> {}

export class CheckListItem
  extends Model<CheckListItemAttributes, CheckListItemCreationAttributes>
  implements CheckListItemAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public case_checklist_rid!: string;
  public checklist_item_name!: string;
  public checklist_item_description?: string;
  public status_rid?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CheckListItem.init(
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
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        case_checklist_rid: { type: DataTypes.STRING(50), allowNull: false },
        checklist_item_name: { type: DataTypes.STRING(255), allowNull: false },
        checklist_item_description: { type: DataTypes.TEXT, allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "checklist_items",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_checklist_items_account_rid",
            fields: ["account_rid"],
          },
          {
            name: "idx_checklist_items_rid",
            fields: ["rid"],
          },
          {
            name: "idx_checklist_items_case_checklist_rid",
            fields: ["case_checklist_rid"],
          },
          {
            name: "idx_checklist_items_checklist_template_rid",
            fields: ["checklist_template_rid"],
          },
          {
            name: "idx_checklist_items_status_rid",
            fields: ["status_rid"],
          },
          {
            name: "idx_checklist_items_attach_to",
            fields: ["attach_to"],
          }
        ],
      }
    );
  }
}