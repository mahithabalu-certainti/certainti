import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface AccountDetailsAttributes {
  rid: number;
  account_rid?: number;
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
  primary_contact_email: string;
  primary_contact_number: string;
  finance_poc_name: string;
  finance_poc_email: string;
  finanace_poc_number: string;
  website?: string;
  project_manager: string;
  database_level: boolean;
  data_residency?: string;
  data_storage?: string;
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
  public primary_contact_email!: string;
  public primary_contact_number!: string;
  public finance_poc_name!: string;
  public finance_poc_email!: string;
  public finanace_poc_number!: string;
  public industry!: string;
  public website?: string;
  public project_manager!: string;
  public database_level!: boolean;
  public data_residency?: string;
  public data_storage?: string;
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
    primary_contact_email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    primary_contact_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    finance_poc_name: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    finance_poc_email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    finanace_poc_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    project_manager: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    database_level: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    data_residency: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
