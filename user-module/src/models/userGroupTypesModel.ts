import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
interface UserGroupTypeAttributes {
  rid: string;
  group_type_name: string;
  group_type_description?: string;
  status?: string;
  created_by?: string;
  modified_by?: string;
  type:string;
  created_datetime?: Date;
  modified_datetime?: Date;
  is_consultant_only_group: boolean;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface UserGroupTypeCreationAttributes
  extends Optional<UserGroupTypeAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class UserGroupType
  extends Model<UserGroupTypeAttributes, UserGroupTypeCreationAttributes>
  implements UserGroupTypeAttributes
{
  public rid!: string;
  public group_type_name!: string;
  public group_type_description?: string;
  public status?: string;
  public created_by?: string;
  public modified_by?: string;
  public type!:string;
  public is_consultant_only_group!: boolean;
  

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    UserGroupType.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        group_type_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        group_type_description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        is_consultant_only_group: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },

        status: {
          type: DataTypes.STRING,
          allowNull: true,
        }
      },
      {
        sequelize,
        modelName: "UserGroupType",
        tableName: "user_group_type",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );
    return UserGroupType;
  }
}
