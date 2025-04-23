import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { MenuModule } from "./menuModuleModel";

interface ProfileMenuModuleAccessAttributes {
  rid: string;
  profile_id: string;
  menu_module_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ProfileModuleAccessCreationAttributes extends Optional<ProfileMenuModuleAccessAttributes, "rid"> {}

export class ProfileMenuModuleAccess
  extends Model<ProfileMenuModuleAccessAttributes, ProfileModuleAccessCreationAttributes>
  implements ProfileMenuModuleAccessAttributes
{
  public rid!: string;
  public profile_id!: string;
  public menu_module_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileMenuModuleAccess.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        profile_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "profile", key: "rid" },
        },
        menu_module_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "menu_module", key: "rid" },
        },
        is_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        created_by: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "ProfileMenuModuleAccess",
        tableName: "profile_menu_module_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    ProfileMenuModuleAccess.belongsTo(Profile, {
      foreignKey: "profile_id",
      as: "profile",
    });

    ProfileMenuModuleAccess.belongsTo(MenuModule, {
      foreignKey: "menu_module_id",
      as: "menu_module",
    });
  }
}
