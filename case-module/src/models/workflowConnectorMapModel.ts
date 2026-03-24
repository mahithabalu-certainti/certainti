import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface WorkflowConnectorMapAttributes {
  rid?: string;
  created_by: string;
  created_datetime : Date;
  modified_by?: string;
  modified_datetime?: Date;
  source_rid: string;
  target_rid: string;
  relationship_connector_rid: string;
  status_rid : string
}

export interface WorkflowConnectorMapCreationAttributes
  extends Optional<WorkflowConnectorMapAttributes, "rid"> {}

export class WorkflowConnectorMapping
  extends Model<
    WorkflowConnectorMapAttributes,
    WorkflowConnectorMapCreationAttributes
  >
  implements WorkflowConnectorMapCreationAttributes
{
  public rid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;
  public source_rid!: string;
  public target_rid!: string;
  public relationship_connector_rid!: string;
  public status_rid! : string

  static initialize(sequelize: Sequelize, schemaName: string) {
    return WorkflowConnectorMapping.init(
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
        },
        status_rid : {
          type : DataTypes.STRING(50),
          allowNull : true
        }
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "workflow_connector_mapping",
        timestamps: false,
        underscored: true,
      }
    );
  }
}