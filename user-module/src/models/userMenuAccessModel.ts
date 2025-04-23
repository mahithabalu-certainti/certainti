import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { User } from "./userModel";
import { Menu } from "./menuModel";

interface UserMenuAccessAttributes {
  rid: string;
  user_id: string;
  menu_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface UserMenuAccessCreationAttributes extends Optional<UserMenuAccessAttributes, "rid"> {}

export class UserMenuAccess
  extends Model<UserMenuAccessAttributes, UserMenuAccessCreationAttributes>
  implements UserMenuAccessAttributes
{
  public rid!: string;
  public user_id!: string;
  public menu_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserMenuAccess.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        menu_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        is_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        created_by: DataTypes.STRING,
        modified_by: DataTypes.STRING,
        created_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: "UserMenuAccess",
        tableName: "user_menu_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    UserMenuAccess.belongsTo(User, { foreignKey: "user_id", as: "user" });
    UserMenuAccess.belongsTo(Menu, { foreignKey: "menu_id", as: "menu" });
  }
}
