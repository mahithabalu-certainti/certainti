import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
interface RegionAttributes {
  rid: string;
  r_number: string;
  country_rid: string;
  country_name: string;
  region_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface RegionCreationAttributes extends Optional<RegionAttributes, "rid"> {}

export class Region
  extends Model<RegionAttributes, RegionCreationAttributes>
  implements RegionAttributes
{
  rid!: string;
  r_number!: string;
  country_rid!: string;
  country_name!: string;
  region_name!: string;
  created_datetime!: Date;
  modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    Region.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        r_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        region_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Region",
        tableName: "regions",
        timestamps: false,
      }
    );

    Region.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });
  }
}
