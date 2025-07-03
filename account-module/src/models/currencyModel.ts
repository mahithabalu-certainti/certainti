import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";
interface CurrencyAttributes {
  rid: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface CurrencyCreationAttributes
  extends Optional<CurrencyAttributes, "rid"> {}

export class Currency
  extends Model<CurrencyAttributes, CurrencyCreationAttributes>
  implements CurrencyAttributes
{
  rid!: string;
  currency_code!: string;
  currency_name!: string;
  currency_symbol!: string;
  created_datetime!: Date;
  modified_datetime!: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    Currency.init(
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
        currency_code: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        currency_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        currency_symbol: {
          type: DataTypes.STRING,
          allowNull: false,
       }
      },
      {
        sequelize,
        modelName: "Currency",
        tableName: "currency",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
  }
}
