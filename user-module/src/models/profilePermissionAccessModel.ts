import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { ModulePermission } from "./modulePermissionModel";
import { ENV_PREFIX } from "../utils/constant";

interface ProfilePermissionAccessAttributes {
  rid: string;
  profile_id: string;
  module_permission_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ProfilePermissionAccessCreationAttributes extends Optional<ProfilePermissionAccessAttributes, "rid"> {}

export class ProfilePermissionAccess
  extends Model<ProfilePermissionAccessAttributes, ProfilePermissionAccessCreationAttributes>
  implements ProfilePermissionAccessAttributes
{
  public rid!: string;
  public profile_id!: string;
  public module_permission_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfilePermissionAccess.init(
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
        modified_datetime: {
          type: DataTypes.DATE,
        },
        profile_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        module_permission_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        is_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
       
      },
      {
        sequelize,
        modelName: "ProfilePermissionAccess",
        tableName: "profile_permission_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            name: 'idx_profile_permission_access_profile_id',
            fields: ['profile_id']
          }
        ]
      }
    );

    ProfilePermissionAccess.belongsTo(Profile, {
      foreignKey: "profile_id",
      as: "profile",
    });

    ProfilePermissionAccess.belongsTo(ModulePermission, {
      foreignKey: "module_permission_id",
      as: "module_permission",
    });
  }
}
