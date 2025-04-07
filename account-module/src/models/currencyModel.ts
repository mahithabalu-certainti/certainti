import { Model, DataTypes, Optional, Sequelize } from "sequelize";
interface CurrencyAttributes {
  rid: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  created_datetime?: Date;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    Currency.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
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
        modelName: "Currency",
        tableName: "currency",
        timestamps: false,
      }
    );
  }
}
