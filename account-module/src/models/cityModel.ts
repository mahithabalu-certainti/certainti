import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
import { States } from "./stateModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface CityAttributes {
  rid: string;
  city_name: string;
  state_rid: string;
  country_rid: string;
  currency_code?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;

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
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    City.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
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
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        city_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        state_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "state",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          }
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "country",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          }
        },
        currency_code: {
          type: DataTypes.STRING(10),
          allowNull: true,
        }
      },
      {
        sequelize,
        modelName: "City",
        tableName: "city",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
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