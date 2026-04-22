import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { MenuModule } from "./menuModuleModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfileModuleAccessAttributes {
  rid: string;
  profile_id: string;
  menu_module_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ProfileModuleAccessCreationAttributes extends Optional<ProfileModuleAccessAttributes, "rid"> {}

export class ProfileModuleAccess
  extends Model<ProfileModuleAccessAttributes, ProfileModuleAccessCreationAttributes>
  implements ProfileModuleAccessAttributes
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
    ProfileModuleAccess.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
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
        profile_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "profile",
            schema : `${MAIN_SCHEMA_NAME}`
          }, key: "rid" },
        },
        menu_module_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "menu_module",
            schema : `${MAIN_SCHEMA_NAME}`
          }, key: "rid" },
        },
        is_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      
      },
      {
        sequelize,
        modelName: "ProfileModuleAccess",
        tableName: "profile_module_access",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    ProfileModuleAccess.belongsTo(Profile, {
      foreignKey: "profile_id",
      as: "profile",
    });

    ProfileModuleAccess.belongsTo(MenuModule, {
      foreignKey: "menu_module_id",
      as: "menu_module",
    });
  }
}
