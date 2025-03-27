import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import DatabaseConnection from "./dbConnectionModel";
import { Country } from "./countryModel";
import { Currency } from "./currencyModel";

interface AccountAttributes {
  rid?: string;
  eid?: string;
  r_number: string;
  account_name: string;
  account_description: string;
  region?: number;
  is_parent: boolean;
  parent_account_rid?: string | null;
  storage_type: string;
  database_connection_rid?: string;
  country_rid: string;
  currency_rid: string;
  industry: string;
  primary_contact_name: string;
  serial_number?: number;
  status: string;
  annual_revenue: string;
}

interface AccountCreationAttributes
  extends Optional<AccountAttributes, "rid"> {}

class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public rid!: string;
  public r_number!: string;
  public account_name!: string;
  public account_description!: string;
  public is_parent!: boolean;
  public eid!: string;
  public region!: number;
  public storage_type!: string;
  public parent_account_rid!: string;
  public database_connection_rid!: string;
  public country_rid!: string;
  public currency_rid!: string;
  public industry!: string;
  public primary_contact_name!: string;
  public serial_number!: number;
  public status!: string;
  public annual_revenue!: string;
}

Account.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    r_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    serial_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    account_description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    eid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["active", "inactive"]],
      },
    },
    is_parent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    annual_revenue: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    region: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    storage_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_account_rid: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    database_connection_rid: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    country_rid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    currency_rid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    industry: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    primary_contact_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Account",
    tableName: "account",
    timestamps: true,
    hooks: {
      beforeValidate: async (account) => {
        const latestAccount = await Account.findOne({
          order: [["serial_number", "DESC"]],
        });

        const serialNumber = latestAccount
          ? latestAccount.serial_number + 1
          : 1;

        const accountCode = `ACC${serialNumber.toString().padStart(4, "0")}`;
        account.setDataValue("r_number", accountCode);
      },
    },
  }
);

// Associations
Account.belongsTo(Account, {
  foreignKey: "parent_account_rid",
  as: "parent_account",
});

Account.hasMany(Account, {
  foreignKey: "parent_account_rid",
  as: "child_accounts",
});

Account.belongsTo(DatabaseConnection, {
  foreignKey: "database_connection_rid",
  as: "database_connection",
});

Account.belongsTo(Country, {
  foreignKey: "country_rid",
  as: "country",
});

Account.belongsTo(Currency, {
  foreignKey: "currency_rid",
  as: "currency",
});

export default Account;
