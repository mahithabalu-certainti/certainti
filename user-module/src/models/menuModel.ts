import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface MenuAttributes {
  rid: string;
  menu_name: string;
  menu_desc: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    Menu.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
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
        }
      },
      {
        sequelize,
        modelName: "Menu",
        tableName: "menu",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (menu) => {
            menu.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            unique: true,
            name: "menu_unique_idx",
            fields: ["menu_name", "menu_desc"],
          },
        ],
      }
    );
  }
}
