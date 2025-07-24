import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { Status } from "./statusModel";
import { User } from "./userModel";
import { UserGroupMapping } from "./userGroupMappingModel";
import { UserGroupType } from "./userGroupTypesModel";
import { UserGroupAccountMapping } from "./userGroupAccountMappingModel";

// Import User model
// import { User } from "./userModel";

interface UserGroupAttributes {
  rid: string;
  r_number?: string;
  group_name: string;
  group_type_rid: string;
  status_rid?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  is_consultant_only_group:boolean;
  user_count?:number;
  account_name?: string;
  usergrouptype?:UserGroupType
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface UserGroupCreationAttributes
  extends Optional<UserGroupAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class UserGroup
  extends Model<UserGroupAttributes, UserGroupCreationAttributes>
  implements UserGroupAttributes
{
  public rid!: string;
  public r_number?:string;
  public group_name!: string;
  public group_type_rid!: string;
  public status_rid!: string;
  public created_by?: string;
  public modified_by?: string;
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
  public is_consultant_only_group!:boolean;
  public account_name?: string
  public user_count?:number;
  public usergrouptype?:UserGroupType


  static initialize(sequelize: Sequelize) {
    // Initialize the model
    UserGroup.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
         r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
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
        group_name: {
          type: DataTypes.STRING,
           allowNull: false,
        },
         group_type_rid: {
          type: DataTypes.STRING,
           allowNull: false,
        },
         is_consultant_only_group: {
          type: DataTypes.BOOLEAN,
           allowNull: false,
        },
        status_rid: {
          type: DataTypes.STRING,
           references: {
            model: {
              tableName : "status",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid",
          },
        }
        
      },
      {
        sequelize,
        modelName: "UserGroup",
        tableName: "user_groups",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );
  }
  static associate(models: any) {
    
    UserGroup.belongsTo(Status, {
         foreignKey: "status_rid",
         as: "status",
       });
     UserGroup.belongsTo(User, {
         foreignKey: "created_by",
         as: "user",
       });
    UserGroup.hasMany(UserGroupMapping, {
        foreignKey: "group_rid",
        as: "usergroup"
      });
       UserGroup.hasMany(UserGroupAccountMapping, {
        foreignKey: "group_rid",
        as: "usergroupaccount"
      });
    UserGroup.belongsTo(UserGroupType, {
        foreignKey: 'group_type_rid',
        as: 'usergrouptype',
    });

    return UserGroup;
  }
}

