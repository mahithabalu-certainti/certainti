import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Menu } from "./menuModel";

interface MenuModuleAttributes {
  rid: string;
  module_name: string;
  module_desc: string;
  menu_id: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface MenuModuleCreationAttributes extends Optional<MenuModuleAttributes, "rid"> {}

export class MenuModule
  extends Model<MenuModuleAttributes, MenuModuleCreationAttributes>
  implements MenuModuleAttributes
{
  public rid!: string;
  public module_name!: string;
  public module_desc!: string;
  public menu_id!: string;
  public status!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    MenuModule.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        module_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        module_desc: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        menu_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "menu",
            key: "rid",
          },
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "active",
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: null,
        },
      },
      {
        sequelize,
        modelName: "MenuModule",
        tableName: "menu_module",
        timestamps: false,
        hooks: {
          beforeUpdate: (menuModule) => {
            menuModule.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    MenuModule.belongsTo(Menu, {
      foreignKey: "menu_id",
      as: "menu",
    });
  }
}
