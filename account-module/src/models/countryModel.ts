import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Currency } from "./currencyModel";
import { R_NUMBER_PREFIX } from "../utils/constant";

interface CountryAttributes {
  rid: string;
  r_number?: string;
  country_code: string;
  country_name: string;
  default_currency_rid: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface CountryCreationAttributes
  extends Optional<CountryAttributes, "rid"> {}

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  rid!: string;
  r_number?: string;
  country_code!: string;
  country_name!: string;
  default_currency_rid!: string;
  created_datetime?: Date;
  modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    Country.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
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
          type: DataTypes.UUID,
          allowNull: false,
          validate: {
            async isCurrencyExist(value: string) {
              const currency = await Currency.findByPk(value);
              if (!currency) {
                throw new Error(`Currency with id ${value} does not exist`);
              }
            },
          },
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

export async function setupCountrySequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS country_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE country
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.COUNTRY} ' || LPAD(nextval('country_seq')::text, 10, '0')`);
    
    console.log('Country sequence setup complete');
  } catch (error) {
    console.error('Error setting up Country sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
