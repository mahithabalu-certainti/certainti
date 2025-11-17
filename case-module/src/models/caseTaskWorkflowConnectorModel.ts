import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface CaseTaskWorkflowConnectorAttributes {
  rid?: string;
  created_by: string;
  created_datetime : Date;
  modified_by?: string;
  modified_datetime?: Date;
  account_rid: string;
  case_rid: string;
  source_rid: string;
  target_rid: string;
  relationship_connector_rid: string;
}

export interface CaseTaskWorkflowConnectorCreationAttributes
  extends Optional<CaseTaskWorkflowConnectorAttributes, "rid"> {}

export class CaseTaskWorkflowConnector
  extends Model<
    CaseTaskWorkflowConnectorAttributes,
    CaseTaskWorkflowConnectorCreationAttributes
  >
  implements CaseTaskWorkflowConnectorAttributes
{
  public rid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public case_rid!: string;
  public source_rid!: string;
  public target_rid!: string;
  public relationship_connector_rid!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return CaseTaskWorkflowConnector.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
        },

        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },

        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },

        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },

        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        source_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        target_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        relationship_connector_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_task_workflow_connector_mapping",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseTaskWorkflowConnectorSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_task_workflow_connector_mapping_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".case_task_workflow_connector_mapping
      ALTER COLUMN r_number SET DEFAULT 'CTKWC-' || LPAD(nextval('"${schemaName}".case_task_workflow_connector_mapping_seq')::text, 10, '0')`);

    logMessage("Cases history sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Cases history sequence: ${error}`);
  }
}