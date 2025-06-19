import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { User } from "./userModel";
import { MenuModule } from "./menuModuleModel";
import { ENV_PREFIX } from "../utils/constant";

interface UserModuleAccessAttributes {
  rid: string;
  user_id: string;
  menu_module_id: string;
  is_enabled: boolean;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface UserModuleAccessCreationAttributes extends Optional<UserModuleAccessAttributes, "rid"> {}

export class UserModuleAccess
  extends Model<UserModuleAccessAttributes, UserModuleAccessCreationAttributes>
  implements UserModuleAccessAttributes
{
  public rid!: string;
  public user_id!: string;
  public menu_module_id!: string;
  public is_enabled!: boolean;
  public created_by?: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserModuleAccess.init(
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
        },
        menu_module_id: {
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
        modelName: "UserModuleAccess",
        tableName: "user_module_access",
        timestamps: false,
        hooks: {
          beforeUpdate: (record) => {
            record.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    UserModuleAccess.belongsTo(User, { foreignKey: "user_id", as: "user" });
    UserModuleAccess.belongsTo(MenuModule, { foreignKey: "menu_module_id", as: "menu_module" });
  }
}
