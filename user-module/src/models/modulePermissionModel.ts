import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { MenuModule } from "./menuModuleModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ModulePermissionAttributes {
  rid: string;
  permission_name: string;
  permission_desc: string;
  menu_module_id: string;
  status: string;
  is_field_available?: boolean;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface ModulePermissionCreationAttributes extends Optional<ModulePermissionAttributes, "rid"> {}

export class ModulePermission
  extends Model<ModulePermissionAttributes, ModulePermissionCreationAttributes>
  implements ModulePermissionAttributes
{
  public rid!: string;
  public permission_name!: string;
  public permission_desc!: string;
  public menu_module_id!: string;
  public status!: string;
  public is_field_available?: boolean;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    ModulePermission.init(
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
        permission_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        permission_desc: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        menu_module_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: {
              tableName : "menu_module",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid",
          },
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "active",
        },
        is_field_available: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: "ModulePermission",
        tableName: "module_permission",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (permission) => {
            permission.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            unique: true,
            name: "permission_unique_idx",
            fields: ["permission_name", "menu_module_id"],
          },
        ],
      }
    );

    ModulePermission.belongsTo(MenuModule, {
      foreignKey: "menu_module_id",
      as: "menu_module",
    });
  }
}
