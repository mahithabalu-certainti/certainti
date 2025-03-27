import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/dataSource';

interface CurrencyAttributes {
  rid: string;            
  currency_code: string;  
  currency_name: string;  
  currency_symbol: string;
}

interface CurrencyCreationAttributes extends Optional<CurrencyAttributes, 'rid'> {}

export class Currency extends Model<CurrencyAttributes, CurrencyCreationAttributes> implements CurrencyAttributes {
  rid!: string;
  currency_code!: string;
  currency_name!: string;
  currency_symbol!: string;
}

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
    },
    currency_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency_symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, 
    modelName: 'Currency', 
    tableName: 'currency', 
    timestamps: true,
  }
);

