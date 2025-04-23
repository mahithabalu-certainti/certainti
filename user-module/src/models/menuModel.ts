import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface MenuAttributes {
  rid: string;
  menu_name: string;
  menu_desc: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface MenuCreationAttributes extends Optional<MenuAttributes, "rid"> {}

export class Menu
  extends Model<MenuAttributes, MenuCreationAttributes>
  implements MenuAttributes
{
  public rid!: string;
  public menu_name!: string;
  public menu_desc!: string;
  public status!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    Menu.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        menu_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        menu_desc: {
          type: DataTypes.STRING,
          allowNull: false,
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
        modelName: "Menu",
        tableName: "menu",
        timestamps: false,
        hooks: {
          beforeUpdate: (menu) => {
            menu.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );
  }
}
