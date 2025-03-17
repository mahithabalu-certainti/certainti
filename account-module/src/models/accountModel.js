const { DataTypes } = require("sequelize");
const sequelize = require("../config/dataSource");

const Account = sequelize.define(
  "account",
  {
    rid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    r_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    account_description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    eid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_account_rid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tax_claim_level: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    max_ai_interactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expiry_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    autosend_interaction: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fiscal_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fiscal_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    interaction_cc_list: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    blended_rate_fte: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    blended_rate_subcon: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    modified_by: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    point_of_contact: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    poc_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    poc_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    industry: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    project_manager: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    database_level: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    annual_revenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    data_residency: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    data_storage: {
      type: DataTypes.ENUM("separate_db", "store_in_parent"),
      allowNull: true,
    },
    created_datetime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    modified_datetime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Account",
    tableName: "account",
    timestamps: true,
  }
);

module.exports = Account;
