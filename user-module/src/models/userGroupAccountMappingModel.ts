import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { Status } from "./statusModel";
import { User } from "./userModel";
import { UserGroupMapping } from "./userGroupMappingModel";
import { UserGroupType } from "./userGroupTypesModel";
import { UserGroup } from "./userGroupModel";

// Import User model
// import { User } from "./userModel";

interface UserGroupAccountMappingAttributes {
  rid: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  group_rid: string;
  account_rid: string;
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface UserGroupAccountMappingCreationAttributes
  extends Optional<UserGroupAccountMappingAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class UserGroupAccountMapping
  extends Model<UserGroupAccountMappingAttributes, UserGroupAccountMappingCreationAttributes>
  implements UserGroupAccountMappingAttributes
{
  public rid!: string;
  public created_by?: string;
  public modified_by?: string;
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
  public group_rid!: string;
  public account_rid!: string;


  static initialize(sequelize: Sequelize) {
    // Initialize the model
    UserGroupAccountMapping.init(
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
        account_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        }
        
      },
      {
        sequelize,
        modelName: "UserGroupAccountMapping",
        tableName: "user_group_account_mapping",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );
  }
  static associate(models: any) {
  
    UserGroupAccountMapping.belongsTo(UserGroup, {
        foreignKey: 'group_rid',
        as: 'usergroupaccount',
    });

    return UserGroupAccountMapping;
  }
}

