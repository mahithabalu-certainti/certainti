import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface CurrencyConversionAttributes {
  rid: string;
  from_currency_code: string;
  to_currency_code: string;
  conversion_rate: number;
  created_datetime?: Date;
  updated_datetime?: Date;
}

interface CurrencyConversionCreationAttributes
  extends Optional<CurrencyConversionAttributes, "rid"> { }

export class CurrencyConversion
  extends Model<CurrencyConversionAttributes, CurrencyConversionCreationAttributes>
  implements CurrencyConversionAttributes {
  rid!: string;
  from_currency_code!: string;
  to_currency_code!: string;
  conversion_rate!: number;
  created_datetime?: Date;
  updated_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    CurrencyConversion.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
        from_currency_code: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        to_currency_code: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        conversion_rate: {
          type: DataTypes.DECIMAL(18, 6),
          allowNull: false,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "CurrencyConversion",
        tableName: "currency_conversion",
        timestamps: false,
        schema: `${MAIN_SCHEMA_NAME}`,
      }
    );
  }
}
