import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { User } from "./userModel";
import { UserGroup } from "./userGroupModel";

interface UserGroupMappingAttributes {
  rid: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  group_rid: string;
  user_rid: string;
  group?:UserGroup;
  
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface UserGroupMappingCreationAttributes
  extends Optional<UserGroupMappingAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class UserGroupMapping
  extends Model<UserGroupMappingAttributes, UserGroupMappingCreationAttributes>
  implements UserGroupMappingAttributes
{
  public rid!: string;
  public group_rid!: string;
  public user_rid!: string;
  public created_by?: string;
  public modified_by?: string;
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
  public group?:UserGroup;


  static initialize(sequelize: Sequelize) {
    // Initialize the model
    UserGroupMapping.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
         created_by: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true
        },
        group_rid: {
          type: DataTypes.STRING,
           allowNull: false,
        },
         user_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "UserGroupMapping",
        tableName: "user_group_mapping",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );
      // Set up the sequence and default value for r_number
      // setupProfileSequence(sequelize);
  }
  static associate(models: any) {
      UserGroupMapping.belongsTo(UserGroup, {
        foreignKey: "group_rid",
        as: "group"
      });
      UserGroupMapping.belongsTo(User, {
        foreignKey: "user_rid",
        as: "user"
      });
    return UserGroupMapping;
  }
}

