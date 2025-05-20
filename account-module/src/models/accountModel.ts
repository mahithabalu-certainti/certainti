import { DataTypes, Model, Optional, Sequelize, UUID } from "sequelize";
import { DatabaseConnection } from "./dbConnectionModel";
import { Country } from "./countryModel";
import { Currency } from "./currencyModel";
import { Industry } from "./industryModel";
import { R_NUMBER_PREFIX } from "../utils/constant";
interface AccountAttributes {
  rid: string;
  eid?: string;
  r_number: string;
  account_name: string;
  comments?: string;
  region?: string;
  is_parent: boolean;
  parent_account_rid?: string | null;
  storage_type: string;
  database_connection_rid?: string;
  country_rid?: string;
  currency_rid?: string;
  industry_rid: string;
  industry_name_other?: string;
  status: string;
  annual_revenue: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface AccountCreationAttributes
  extends Optional<AccountAttributes, "rid"> {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public rid!: string;
  public r_number!: string;
  public account_name!: string;
  public comments?: string;
  public is_parent!: boolean;
  public eid?: string;
  public region?: string;
  public storage_type!: string;
  public parent_account_rid?: string | null;
  public database_connection_rid?: string;
  public country_rid?: string;
  public currency_rid?: string;
  public industry_rid!: string;
  public industry_name_other?: string;
  public status!: string;
  public annual_revenue!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
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
        account_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        eid: {
          type: DataTypes.STRING,
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
          type: DataTypes.STRING(20),
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
          allowNull: true,
        },
        currency_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        industry_rid: {
          type: UUID,
          allowNull: false,
        },
        industry_name_other: {
          type: DataTypes.STRING(255),
          allowNull: true
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
        created_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        }
      },
      {
        sequelize,
        modelName: "Account",
        tableName: "account",
        timestamps: false,
        hooks: {
          beforeUpdate: (user) => {
            user.setDataValue("modified_datetime", new Date());
          },
          beforeValidate: async (account) => {
            // Get the latest account number and increment it
            const latestAccount = await Account.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }
            
            const accountCode = `${R_NUMBER_PREFIX.ACCOUNT} ${nextNumber}`;
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

    Account.belongsTo(Industry, {
      foreignKey: "industry_rid",
      as: "industry",
    });

    Account.belongsTo(Currency, {
      foreignKey: "currency_rid",
      as: "currency",
    });
  }
}
