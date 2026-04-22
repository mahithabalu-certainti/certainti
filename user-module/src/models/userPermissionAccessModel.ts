import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { User } from "./userModel";
import { ModulePermission } from "./modulePermissionModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface UserPermissionAccessAttributes {
  rid: string;
  user_id: string;
  module_permission_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface UserPermissionAccessCreationAttributes extends Optional<UserPermissionAccessAttributes, "rid"> {}

export class UserPermissionAccess
  extends Model<UserPermissionAccessAttributes, UserPermissionAccessCreationAttributes>
  implements UserPermissionAccessAttributes
{
  public rid!: string;
  public user_id!: string;
  public module_permission_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserPermissionAccess.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: DataTypes.STRING,
        modified_by: DataTypes.STRING,
        created_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: DataTypes.DATE,
        user_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references : {
            model : {
              tableName : "user",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key : 'rid'
          }
        },
        module_permission_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references : {
            model : {
              tableName : "module_permission",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key : 'rid'
          }
        },
        is_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        }
      },
      {
        sequelize,
        modelName: "UserPermissionAccess",
        tableName: "user_permission_access",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            name: 'idx_user_permission_access_user_id',
            fields: ['user_id']
          }
        ]
      }
    );

    UserPermissionAccess.belongsTo(User, { foreignKey: "user_id", as: "user" });
    UserPermissionAccess.belongsTo(ModulePermission, { foreignKey: "module_permission_id", as: "module_permission" });
  }
}
