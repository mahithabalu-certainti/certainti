import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { Menu } from "./menuModel";

interface ProfileMenuAccessAttributes {
  rid: string;
  profile_id: string;
  menu_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ProfileMenuAccessCreationAttributes extends Optional<ProfileMenuAccessAttributes, "rid"> {}

export class ProfileMenuAccess
  extends Model<ProfileMenuAccessAttributes, ProfileMenuAccessCreationAttributes>
  implements ProfileMenuAccessAttributes
{
  public rid!: string;
  public profile_id!: string;
  public menu_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileMenuAccess.init(
      {
        rid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        profile_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "profile", key: "rid" },
        },
        menu_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "menu", key: "rid" },
        },
        is_enabled: { type: DataTypes.BOOLEAN, allowNull: false },
        created_by: { type: DataTypes.STRING },
        modified_by: { type: DataTypes.STRING },
        created_datetime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, defaultValue: null },
      },
      {
        sequelize,
        modelName: "ProfileMenuAccess",
        tableName: "profile_menu_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    ProfileMenuAccess.belongsTo(Profile, { foreignKey: "profile_id", as: "profile" });
    ProfileMenuAccess.belongsTo(Menu, { foreignKey: "menu_id", as: "menu" });
  }
}
