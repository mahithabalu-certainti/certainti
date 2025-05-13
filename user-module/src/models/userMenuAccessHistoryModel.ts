import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserMenuAccess } from "./userMenuAccessModel";

interface UserMenuAccessHistoryAttributes {
  rid: string;
  user_menu_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
}

interface UserMenuAccessHistoryCreationAttributes extends Optional<UserMenuAccessHistoryAttributes, "rid"> {}

export class UserMenuAccessHistory
  extends Model<UserMenuAccessHistoryAttributes, UserMenuAccessHistoryCreationAttributes>
  implements UserMenuAccessHistoryAttributes
{
  public rid!: string;
  public user_menu_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserMenuAccessHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        user_menu_access_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "user_menu_access", key: "rid" },
        },
        attribute_name: { 
          type: DataTypes.STRING, 
          allowNull: false 
        },
        old_value: { 
          type: DataTypes.TEXT, 
          allowNull: true 
        },
        new_value: { 
          type: DataTypes.TEXT, 
          allowNull: true 
        },
        modified_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
        },
      },
      {
        sequelize,
        modelName: "UserMenuAccessHistory",
        tableName: "user_menu_access_history",
        timestamps: false,
      }
    );

    // Define association with UserMenuAccess model
    UserMenuAccessHistory.belongsTo(UserMenuAccess, { 
      foreignKey: "user_menu_access_rid", 
      as: "user_menu_access" 
    });
  }
}