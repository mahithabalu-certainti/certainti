import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface WorkflowConnectorAttributes {
  rid?: string;
  created_by?: string;
  created_datetime?: Date;
  modified_by?: string;
  modified_datetime?: Date;
  relationship_type: string;
  sequence?: number;
  status?: string;
}

export interface WorkflowConnectorCreationAttributes
  extends Optional<WorkflowConnectorAttributes, "rid"> {}

export class WorkflowConnector
  extends Model<
    WorkflowConnectorAttributes,
    WorkflowConnectorCreationAttributes
  >
  implements WorkflowConnectorAttributes
{
  public rid?: string;
  public created_by?: string;
  public created_datetime?: Date;
  public modified_by?: string;
  public modified_datetime?: Date;
  public relationship_type!: string;
  public sequence?: number;
  public status?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return WorkflowConnector.init(
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
          allowNull: true,
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

        relationship_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },

        sequence: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },

        status: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "workflow_connector",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
