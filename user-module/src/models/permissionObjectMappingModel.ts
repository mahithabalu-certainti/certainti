import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ModulePermission } from "./modulePermissionModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface PermissionObjectMappingAttributes {
  rid: string;
  created_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  dependent_type: string;
  dependent_id: string;
  depends_on_type: string;
  depends_on_id: string;
}

interface PermissionObjectMappingCreationAttributes extends Optional<PermissionObjectMappingAttributes, "rid"> {}

export class PermissionObjectMapping
  extends Model<PermissionObjectMappingAttributes, PermissionObjectMappingCreationAttributes>
  implements PermissionObjectMappingAttributes
{
  public rid!: string;
  public dependent_type!: string;
  public dependent_id!: string;
  public depends_on_type!: string;
  public depends_on_id!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;

  static initialize(sequelize: Sequelize) {
    PermissionObjectMapping.init(
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
        dependent_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        dependent_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        depends_on_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        depends_on_id:{
          type: DataTypes.STRING,
          allowNull: false,
        }
      },
      {
        sequelize,
        modelName: "PermissionObjectMapping",
        tableName: "permission_object_mapping",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (field) => {
            field.setDataValue("modified_datetime", new Date());
          },
        }
      }
    );

   
  }
}
