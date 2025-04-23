import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { MenuModule } from "./menuModuleModel";

interface ModulePermissionAttributes {
  rid: string;
  permission_name: string;
  menu_module_id: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ModulePermissionCreationAttributes extends Optional<ModulePermissionAttributes, "rid"> {}

export class ModulePermission
  extends Model<ModulePermissionAttributes, ModulePermissionCreationAttributes>
  implements ModulePermissionAttributes
{
  public rid!: string;
  public permission_name!: string;
  public menu_module_id!: string;
  public status!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ModulePermission.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        permission_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        menu_module_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "menu_module",
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
        modelName: "ModulePermission",
        tableName: "module_permission",
        timestamps: false,
        hooks: {
          beforeUpdate: (permission) => {
            permission.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );

    ModulePermission.belongsTo(MenuModule, {
      foreignKey: "menu_module_id",
      as: "menu_module",
    });
  }
}
