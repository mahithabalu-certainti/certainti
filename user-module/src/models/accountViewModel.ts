// models/AccountView.ts
import { Model, DataTypes, Sequelize } from "sequelize";
import { MAIN_SCHEMA_NAME } from "../utils/constant";

interface AccountViewAttributes {
  rid: string;
  account_name: string;
  organisation_name: string;
  status_rid: string;
  is_parent: boolean;
  parent_account_rid?: string | null;
  logo_url?: string;
}

export class AccountView extends Model<AccountViewAttributes> implements AccountViewAttributes {
  public rid!: string;
  public account_name!: string;
  public organisation_name!: string;
  public status_rid!: string;
  public is_parent!: boolean;
  public parent_account_rid?: string | null;
  public logo_url?: string;

  static initialize(sequelize: Sequelize) {
    AccountView.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false,
        },
        account_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        organisation_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status_rid: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        is_parent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        parent_account_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        logo_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "AccountView",
        tableName: "account", // Same table as Account
        schema: MAIN_SCHEMA_NAME,
        timestamps: false,
      }
    );
  }
}