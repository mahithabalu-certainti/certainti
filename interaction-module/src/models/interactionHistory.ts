import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface InteractionHistoryAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  interaction_rid: string;
  interaction_item_rid: string;
  attribute_name: string;
  old_value?: string;
  new_value?: string;
}

export interface InteractionHistoryCreationAttributes
  extends Optional<InteractionHistoryAttributes, "rid"> {}

export class InteractionHistory
  extends Model<
    InteractionHistoryAttributes,
    InteractionHistoryCreationAttributes
  >
  implements InteractionHistoryAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public interaction_rid!: string;
  public interaction_item_rid!: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return InteractionHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(120),
          allowNull: true,
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
        interaction_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        interaction_item_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        new_value: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
