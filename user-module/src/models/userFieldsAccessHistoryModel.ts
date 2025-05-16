import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { UserFieldsAccess } from "./userFieldsAccessModel";

interface UserFieldsAccessHistoryAttributes {
  rid: string;
  user_fields_access_rid: string;
  attribute_name: string;
  old_value: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
}

interface UserFieldsAccessHistoryCreationAttributes extends Optional<UserFieldsAccessHistoryAttributes, "rid"> {}

export class UserFieldsAccessHistory
  extends Model<UserFieldsAccessHistoryAttributes, UserFieldsAccessHistoryCreationAttributes>
  implements UserFieldsAccessHistoryAttributes
{
  public rid!: string;
  public user_fields_access_rid!: string;
  public attribute_name!: string;
  public old_value!: string;
  public new_value!: string;
  public modified_by?: string;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    UserFieldsAccessHistory.init(
      {
        rid: { 
          type: DataTypes.UUID, 
          defaultValue: DataTypes.UUIDV4, 
          primaryKey: true 
        },
        user_fields_access_rid: {
          type: DataTypes.UUID,
          allowNull: false,
          references: { model: "user_fields_access", key: "rid" },
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
        modelName: "UserFieldsAccessHistory",
        tableName: "user_fields_access_history",
        timestamps: false,
      }
    );

    // Define association with UserFieldsAccess model
    UserFieldsAccessHistory.belongsTo(UserFieldsAccess, { 
      foreignKey: "user_fields_access_rid", 
      as: "user_fields_access" 
    });
  }
}