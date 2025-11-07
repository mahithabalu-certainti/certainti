import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CheckListAttributes {
  rid: string;
  r_number?: string;
  fiscal_year?: number;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  attach_to?: string;
  attachment_level?: string;
  checklist_template_rid?: string;
  checklist_name: string;
  checklist_description?: string;
  assigned_to?: string;
  status_rid?: string;
}

export interface CheckListCreationAttributes
  extends Optional<CheckListAttributes, "rid"> {}

export class CheckList
  extends Model<CheckListAttributes, CheckListCreationAttributes>
  implements CheckListAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public fiscal_year?: number;
  public attach_to?: string;
  public attachment_level?: string;
  public checklist_template_rid?: string;
  public checklist_name!: string;
  public checklist_description?: string;
  public assigned_to?: string;
  public status_rid?: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CheckList.init(
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
        account_rid: { type: DataTypes.STRING(50), allowNull: false,
          references: {
            model: {
              tableName: 'account_details',
              schema: schemaName
            },
            key: 'account_rid'
          },
          onUpdate: 'CASCADE'
         },
        attach_to: { type: DataTypes.STRING(50), allowNull: true },
        attachment_level: { type: DataTypes.STRING(50), allowNull: true },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: true },
        checklist_template_rid: { type: DataTypes.STRING(50), allowNull: true },
        checklist_name: { type: DataTypes.STRING(255), allowNull: false },
        checklist_description: { type: DataTypes.TEXT, allowNull: true },
        assigned_to: { type: DataTypes.STRING(50), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "checklists",
        timestamps: false,
        underscored: true,
        indexes: [
          {
            name: "idx_checklists_account_rid",
            fields: ["account_rid"],
          },
          {
            name: "idx_checklists_rid",
            fields: ["rid"],
          },
          {
            name: "idx_checklists_checklist_template_rid",
            fields: ["checklist_template_rid"],
          },
          {
            name: "idx_checklists_assigned_to",
            fields: ["assigned_to"],
          },
          {
            name: "idx_checklists_status_rid",
            fields: ["status_rid"],
          },
          {
            name: "idx_checklists_attach_to",
            fields: ["attach_to"],
          }
        ],
      }
    );
  }
}

export async function setupCheckListSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".checklists_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".checklists
      ALTER COLUMN r_number SET DEFAULT 'CHK-' || LPAD(nextval('"${schemaName}".checklists_seq')::text, 10, '0')`);

    logMessage("CheckLists sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CheckLists sequence: ${error}`);
  }
}