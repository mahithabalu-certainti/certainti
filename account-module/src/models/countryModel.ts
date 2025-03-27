import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import { Currency } from "./currencyModel";

interface CountryAttributes {
  rid: string;
  r_number: string;
  country_code: string;
  country_name: string;
  default_currency_rid: string;
}

interface CountryCreationAttributes
  extends Optional<CountryAttributes, "rid"> {}

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  rid!: string;
  r_number!: string;
  country_code!: string;
  country_name!: string;
  default_currency_rid!: string;
  createdAt!: string;
  updatedAt!: string;
}

Country.init(
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
    country_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    default_currency_rid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Country",
    tableName: "country",
    timestamps: true,
  }
);

Country.belongsTo(Currency, {
  foreignKey: "default_currency_rid",
  as: "currency",
});
