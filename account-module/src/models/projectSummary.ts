import { DataTypes, Model, Sequelize, Optional, UUIDV4 } from "sequelize";
import { Account } from "./accountModel";
import { Country } from "./countryModel";
import { Currency } from "./currencyModel";
import { Industry } from "./industryModel";
import { States } from "./stateModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { errorLog } from "../utils/helpers";

interface ProjectSummaryAttributes {
  rid: string;
  r_number: string;
  project_id: string;
  project_number: string;
  project_code: string;
  industry_rid?: string | null;
  industry_name?: string | null;
  account_rid: string;
  program_name?: string | null;
  project_name?: string | null;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_status: "Active" | "Inactive";
  project_type: string;
  project_classification_rid?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  fiscal_year: number;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;
  total_effort?: number | null;
  total_cost?: number | null;
  total_fte?: number | null;
  total_sub_con?: number | null;
  total_non_labor_cost?: number | null;
  total_fte_cost?: number | null;
  total_sub_con_cost?: number | null;
  comments?: string | null;
  qualified_research_expenditure?: number | null;
  is_rd_qualified?: boolean | null;
  qre?: number | null;
  project_point_of_contact?: string | null;
  financial_consultant?: string | null;
  technical_point_of_contact?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
  assessment_status?: string | null;
  project_classification_other?: string | null;
}

type ProjectSummaryCreationAttributes = Optional<
  ProjectSummaryAttributes,
  "rid" | "created_datetime" | "modified_datetime"
>;

export class ProjectSummary
  extends Model<ProjectSummaryAttributes, ProjectSummaryCreationAttributes>
  implements ProjectSummaryAttributes
{
  declare rid: string;
  declare r_number: string;
  declare project_id: string;
  declare project_number: string;
  declare project_code: string;
  declare industry_rid: string | null;
  declare industry_name: string | null;
  declare account_rid: string;
  declare program_name: string | null;
  declare project_name: string | null;
  declare project_startdate: Date | null;
  declare project_enddate: Date | null;
  declare project_status: "Active" | "Inactive";
  declare project_type: string;
  declare project_classification_rid: string | null;
  declare project_client_group: string | null;
  declare project_group: string | null;
  declare fiscal_year: number;
  declare country_rid: string | null;
  declare region_rid: string | null;
  declare currency_rid: string | null;
  declare total_effort: number | null;
  declare total_cost: number | null;
  declare total_fte: number | null;
  declare total_sub_con: number | null;
  declare total_non_labor_cost: number | null;
  declare total_fte_cost: number | null;
  declare total_sub_con_cost: number | null;
  declare comments: string | null;
  declare qualified_research_expenditure: number | null;
  declare is_rd_qualified: boolean | null;
  declare qre: number | null;
  declare project_point_of_contact: string | null;
  declare financial_consultant: string | null;
  declare technical_point_of_contact: string | null;
  declare created_datetime: Date;
  declare modified_datetime: Date;
  declare created_by: string;
  declare modified_by: string | null;
  declare assessment_status?: string | null;
  declare project_classification_other?: string | null;

  static initialize(sequelize: Sequelize) {
    ProjectSummary.init(
      {
        rid: {
          type: DataTypes.STRING(50),
           defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        project_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        project_number: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        project_code: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        industry_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "industry",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        industry_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: {
              tableName : "account",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        program_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_startdate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        project_enddate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
        },
        project_status: {
          type: DataTypes.ENUM("Active", "Inactive"),
          allowNull: false,
        },
        project_type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        project_client_group: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        project_group: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "country",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        region_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "state",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        currency_rid : {
          type: DataTypes.STRING(50),
          allowNull: true,
          references: {
            model: {
              tableName : "currency",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        total_effort: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        total_cost: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        total_fte: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_sub_con: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_non_labor_cost: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        total_fte_cost: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        total_sub_con_cost: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        qualified_research_expenditure: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        is_rd_qualified: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        qre: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        project_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        financial_consultant: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        technical_point_of_contact: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        assessment_status: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        project_classification_other: {
          type: DataTypes.STRING(300),
          allowNull: true,
        }
      },
      {
        sequelize,
        tableName: "project_summary",
        schema: `${MAIN_SCHEMA_NAME}`,
        timestamps: false,
      }
    );

    ProjectSummary.belongsTo(Account, {
      foreignKey: "account_rid",
      as: "account",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    ProjectSummary.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country_ref",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    ProjectSummary.belongsTo(Currency, {
      foreignKey: "currency_rid",
      as: "currency_ref",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    ProjectSummary.belongsTo(Industry, {
      foreignKey: "industry_rid",
      as: "industry",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    ProjectSummary.belongsTo(States, {
      foreignKey: "region_rid",
      as: "region_ref",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  }
}

export async function setupKeyContactsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".key_contact_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".key_contact_details
          ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.KEY_CONTACT_DETAILS}-' || LPAD(nextval('"${schemaName}".key_contact_seq')::text, 10, '0')`);
  } catch (error) {
    errorLog("Error setting up Key contact sequence:", (error as Error).message);
  }
}
