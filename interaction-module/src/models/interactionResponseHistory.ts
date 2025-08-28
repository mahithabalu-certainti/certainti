import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MAIN_SCHEMA_NAME, ENV_PREFIX } from "../utils/constants";

interface InteractionResponseHistoryAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  interaction_rid: string;
  interaction_item_rid?: string | null;
  response_on?: Date;
  response_email?: string;
  response_by?: string;
  response_source_rid?: string;
  interaction_response?: string;
  interaction_version: number;
}

type InteractionResponseHistoryCreationAttributes = Optional<
  InteractionResponseHistoryAttributes,
  "rid"
>;

export class InteractionResponseHistory
  extends Model<
    InteractionResponseHistoryAttributes,
    InteractionResponseHistoryCreationAttributes
  >
  implements InteractionResponseHistoryAttributes
{
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public interaction_rid!: string;
  public interaction_item_rid?: string | null;
  public response_on?: Date;
  public response_email?: string;
  public response_by?: string;
  public response_source_rid?: string;
  public interaction_response?: string;
  public interaction_version!: number;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return InteractionResponseHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: { type: DataTypes.STRING(120), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        interaction_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_item_rid: { type: DataTypes.STRING(50), allowNull: true },
        response_on: { type: DataTypes.DATE, allowNull: true },
        response_email: { type: DataTypes.STRING(255), allowNull: true },
        response_by: { type: DataTypes.STRING(50), allowNull: true },
        response_source_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_response: { type: DataTypes.STRING(50), allowNull: true },
        interaction_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_response_history",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
