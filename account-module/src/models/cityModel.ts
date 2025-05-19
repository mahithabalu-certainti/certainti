import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
import { States } from "./stateModel";

interface CityAttributes {
  rid: string;
  city_name: string;
  state_rid: string;
  country_rid: string;
  currency_code?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface CityCreationAttributes extends Optional<CityAttributes, "rid"> {}

export class City
  extends Model<CityAttributes, CityCreationAttributes>
  implements CityAttributes
{
  rid!: string;
  city_name!: string;
  state_rid!: string;
  country_rid!: string;
  currency_code?: string;
  created_datetime!: Date;
  modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    City.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        city_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        state_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        currency_code: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
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
        modelName: "City",
        tableName: "city",
        timestamps: false,
      }
    );

    City.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });

    City.belongsTo(States, {
      foreignKey: "state_rid",
      as: "state",
    });
  }
}