import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Currency } from "./currencyModel";
import { ENV_PREFIX } from "../utils/constant";

interface CountryAttributes {
  rid: string;
  country_code: string;
  country_name: string;
  default_currency_rid: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface CountryCreationAttributes
  extends Optional<CountryAttributes, "rid"> {}

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  rid!: string;
  country_code!: string;
  country_name!: string;
  default_currency_rid!: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    Country.init(
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        country_code: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        default_currency_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          validate: {
            async isCurrencyExist(value: string) {
              const currency = await Currency.findByPk(value);
              if (!currency) {
                throw new Error(`Currency with id ${value} does not exist`);
              }
            },
          },
        }
      },
      {
        sequelize,
        modelName: "Country",
        tableName: "country",
        timestamps: false,
      }
    );

    Country.belongsTo(Currency, {
      foreignKey: "default_currency_rid",
      as: "currency",
    });
  }
}


