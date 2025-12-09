import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

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
  project_manager: string;
  database_level: boolean;
  data_residency?: string;
  data_storage?: string;
  business_details: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  auto_access_rd? : boolean
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
  public project_manager!: string;
  public database_level!: boolean;
  public data_residency?: string;
  public data_storage?: string;
  public business_details!: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public auto_access_rd? : boolean

static initialize(sequelize: Sequelize, schema: string){
AccountDetails.init(
  {
    rid: {
      type: DataTypes.STRING(50),
      defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
      primaryKey: true,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    modified_by: {
      type: DataTypes.STRING(255),
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
        },
    account_rid: {
      type: DataTypes.STRING(50),
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
    auto_access_rd: {
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
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    project_manager: {
      type: DataTypes.STRING(128),
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
    sequelize: sequelize,
    modelName: "AccountDetails",
    tableName: "account_details",
    schema: schema,
    timestamps: false,
  }
);
return AccountDetails;
}
}

export default AccountDetails;
