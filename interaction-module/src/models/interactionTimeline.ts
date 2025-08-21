import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface InteractionTimelineAttributes {
  rid?: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid?: string;
  entity_rid?: string;
  event_name?: string;
  event_type?: string;
  event_status?: string;
  event_datetime?: Date;
}

export interface InteractionTimelineCreationAttributes
  extends Optional<InteractionTimelineAttributes, "rid"> {}

export class InteractionTimeline
  extends Model<
    InteractionTimelineAttributes,
    InteractionTimelineCreationAttributes
  >
  implements InteractionTimelineAttributes
{
  public rid?: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid?: string;
  public entity_rid?: string;
  public event_name?: string;
  public event_type?: string;
  public event_status?: string;
  public event_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return InteractionTimeline.init(
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
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        entity_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        event_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_type: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_timeline",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
