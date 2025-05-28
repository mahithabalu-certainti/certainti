import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface AccountDetailsAttributes {
  rid: number;
  account_rid?: number;
  account_name?: string;
  tax_claim_level: string;
  max_ai_interactions: number;
  expiry_duration: number;
  autosend_interaction: boolean;
  fiscal_start_date: string;
  fiscal_end_date: string;
  interaction_cc_list?: string;
  blended_rate_fte?: string;
  blended_rate_subcon?: string;
  created_by?: string;
  modified_by?: string;
  website?: string;
  database_level: boolean;
  data_residency?: string;
  data_storage?: string;
  business_details: string;
}

interface AccountDetailsCreationAttributes
  extends Optional<
    AccountDetailsAttributes,
    "rid" 
  > {}

class AccountDetails
  extends Model<AccountDetailsAttributes, AccountDetailsCreationAttributes>
  implements AccountDetailsAttributes
{
  public rid!: number;
  public account_name?: string;
  public tax_claim_level!: string;
  public max_ai_interactions!: number;
  public expiry_duration!: number;
  public autosend_interaction!: boolean;
  public fiscal_start_date!: string;
  public fiscal_end_date!: string;
  public interaction_cc_list?: string;
  public blended_rate_fte?: string;
  public blended_rate_subcon?: string;
  public created_by?: string;
  public modified_by?: string;
  public industry_rid!: string;
  public industry_name_other?: string;
  public website?: string;
  public database_level!: boolean;
  public data_residency?: string;
  public data_storage?: string;
  public business_details!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;

}

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "mysql", // Change to your dialect, e.g., 'postgres'
});

AccountDetails.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    account_rid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tax_claim_level: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    max_ai_interactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 3,
        max: 5,
      },
    },
    expiry_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    autosend_interaction: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fiscal_start_date: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fiscal_end_date: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    interaction_cc_list: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    blended_rate_fte: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    blended_rate_subcon: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    modified_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    database_level: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    data_residency: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    business_details: {
      type: DataTypes.STRING(2000),
      allowNull: false,
    },
    data_storage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isIn: [["separate_db", "store_in_parent"]],
      },
    },
  },
  {
    sequelize,
    modelName: "AccountDetails",
    tableName: "account_details",
    timestamps: false,
  }
);

export default AccountDetails;
