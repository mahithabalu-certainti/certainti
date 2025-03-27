import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import { Country } from "./countryModel";

interface RegionAttributes {
  rid: string;
  r_number: string;
  country_rid: string;
  country_name: string;
  region_name: string;
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
}

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
  },
  {
    sequelize,
    modelName: "Region",
    tableName: "regions",
    timestamps: true,
  }
);

Region.belongsTo(Country, {
  foreignKey: "country_rid",
  as: "country",
});
