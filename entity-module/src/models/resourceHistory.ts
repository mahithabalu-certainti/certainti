import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourcesHistoryAttributes {
  rid?: string;
  resource_rid: string;
  r_number?: string;
  attribute_name: string;
  old_value?: string;
  new_value: string;
  modified_by: string;
  modified_datetime?: Date;
  created_datetime?: Date;
}

interface ResourcesHistoryCreationAttributes
  extends Optional<ResourcesHistoryAttributes, "rid"> {}

export class ResourcesHistory
  extends Model<ResourcesHistoryAttributes, ResourcesHistoryCreationAttributes>
  implements ResourcesHistoryAttributes
{
  public rid?: string;
  public resource_rid!: string;
  public r_number?: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value!: string;
  public modified_datetime?: Date;
  public modified_by!: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ResourcesHistory.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        resource_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
        new_value: {
          type: DataTypes.STRING(1000),
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "resources_history",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("modified_datetime", new Date());
            resources.setDataValue("created_datetime", new Date());
          },
          beforeValidate: async (resource) => {            
            const accountCode = `${R_NUMBER_PREFIX.RESOURCE_HISTORY} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            resource.setDataValue("r_number", accountCode);
          },
        },
      }
    );
    return ResourcesHistory;
  }
}
