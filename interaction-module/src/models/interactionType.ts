import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface InteractionTypeAttributes {
  rid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  interaction_type_name: string;
  interaction_type_description?: string;
  status?: string;
}

export interface InteractionTypeCreationAttributes extends Optional<InteractionTypeAttributes, "rid"> {}

export class InteractionType extends Model<InteractionTypeAttributes, InteractionTypeCreationAttributes> implements InteractionTypeAttributes {
  public rid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public interaction_type_name!: string;
  public interaction_type_description?: string;
  public status?: string;

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return InteractionType.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
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
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        interaction_type_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        interaction_type_description: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_type",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
