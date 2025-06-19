import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ModulePermission } from "./modulePermissionModel";
import { ENV_PREFIX } from "../utils/constant";

interface PermissionFieldAttributes {
  rid: string;
  field_name: string;
  field_desc: string;
  module_permission_id: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface PermissionFieldCreationAttributes extends Optional<PermissionFieldAttributes, "rid"> {}

export class PermissionField
  extends Model<PermissionFieldAttributes, PermissionFieldCreationAttributes>
  implements PermissionFieldAttributes
{
  public rid!: string;
  public field_name!: string;
  public field_desc!: string;
  public module_permission_id!: string;
  public status!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    PermissionField.init(
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
        field_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        field_desc: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        module_permission_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: "module_permission",
            key: "rid",
          },
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "active",
        },
      },
      {
        sequelize,
        modelName: "PermissionField",
        tableName: "permission_fields",
        timestamps: false,
        hooks: {
          beforeUpdate: (field) => {
            field.setDataValue("modified_datetime", new Date());
          },
        },
        indexes: [
          {
            unique: true,
            name: "field_unique_idx",
            fields: ["field_name", "module_permission_id"],
          },
        ],
      }
    );

    PermissionField.belongsTo(ModulePermission, {
      foreignKey: "module_permission_id",
      as: "module_permission",
    });
  }
}
