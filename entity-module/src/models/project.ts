import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
export interface ProjectAttributes {
  rid?: string;
  r_number?: string;
  eid?: string;
  project_code: string;
  industry_rid: string;
  industry_name?: string;
  account_rid: string;
  account_fiscal_rid: string | null;
  program_name?: string | null;
  project_name?: string | null;
  project_startdate?: Date | null;
  project_enddate?: Date | null;
  project_type: "Fixed" | "Time & Material";
  project_classification_rid?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_status: "Active" | "Inactive";
  fiscal_year: number;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  total_effort?: string | null;
  total_cost?: string | null;
  total_fte?: number;
  total_sub_con?: number;
  total_non_labor_cost?: string | null;
  total_fte_effort?: string | null;
  total_sub_con_effort?: string | null;
  total_fte_cost?: string | null;
  total_sub_con_cost?: string | null;
  auto_send_ai_interaction: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: number | null;
  project_description?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
  blended_rate?: number | null;
  comments?: string | null;
  qualified_research_expenditure?: number | null;
  is_rd_qualified?: boolean | null;
  qre?: number | null;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "rid"> {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public rid?: string;
  public r_number?: string;
  public project_code!: string;
  public account_fiscal_rid!: string;
  public account_rid!: string;
  public industry_rid!: string;
  public industry_name?: string;
  public program_name?: string | null;
  public project_name?: string | null;
  public project_startdate?: Date | null;
  public project_enddate?: Date | null;
  public project_type!: "Fixed" | "Time & Material";
  public project_classification_rid?: string | null;
  public project_client_group?: string | null;
  public project_group?: string | null;
  public project_status!: "Active" | "Inactive";
  public fiscal_year!: number;
  public country?: string | null;
  public region?: string | null;
  public currency?: string | null;
  public total_effort?: string | null;
  public total_cost?: string | null;
  public total_fte?: number;
  public total_sub_con?: number;
  public total_non_labor_cost?: string | null;
  public total_fte_effort?: string | null;
  public total_sub_con_effort?: string | null;
  public total_fte_cost?: string | null;
  public total_sub_con_cost?: string | null;
  public auto_send_ai_interaction!: boolean;
  public auto_access_rd?: boolean;
  public max_ai_interaction!: number;
  public blended_rate_fte?: string | null;
  public blended_rate_sub_con?: number | null;
  public project_description?: string | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;
  public blended_rate?: number | null;
  public comments?: string | null;
  public qualified_research_expenditure?: number | null;
  public is_rd_qualified?: boolean | null;
  public qre?: number | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    Project.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        eid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        account_fiscal_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        project_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        industry_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        industry_name: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        program_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        project_name: DataTypes.STRING(255),
        project_startdate: DataTypes.DATE,
        project_enddate: DataTypes.DATE,
        project_type: {
          type: DataTypes.ENUM("Fixed", "Time & Material"),
          allowNull: false,
        },
        project_classification_rid: {
          type: DataTypes.UUID,
          allowNull: true
        },
        project_client_group: DataTypes.STRING(200),
        project_group: DataTypes.STRING(150),
        project_status: {
          type: DataTypes.ENUM("Active", "Inactive"),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        country: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        region: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        currency: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        total_effort: DataTypes.DOUBLE,
        total_cost: DataTypes.DOUBLE,
        total_fte: DataTypes.INTEGER,
        total_sub_con: DataTypes.INTEGER,
        total_fte_effort: DataTypes.DOUBLE,
        total_sub_con_effort: DataTypes.DOUBLE,
        total_fte_cost: DataTypes.DOUBLE,
        total_sub_con_cost: DataTypes.DOUBLE,
        total_non_labor_cost: DataTypes.DOUBLE,
        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        auto_access_rd: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        max_ai_interaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        blended_rate: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        blended_rate_fte: DataTypes.DOUBLE,
        blended_rate_sub_con: DataTypes.DOUBLE,
        project_description: DataTypes.STRING(2000),
        qualified_research_expenditure: {
          type: DataTypes.DOUBLE,
          allowNull: true
        },
        is_rd_qualified: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        },
        qre: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeValidate: async (account) => {
            const latestAccount = await Project.findOne({
              order: [["r_number", "DESC"]],
            });

            let nextNumber = "0000000001";
            if (latestAccount) {
              const currentNumber = parseInt(
                latestAccount.r_number?.split(" ")[1] || "0"
              );
              nextNumber = (currentNumber + 1).toString().padStart(10, "0");
            }
            const accountCode = `${R_NUMBER_PREFIX.PROJECT} ${nextNumber}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );

    return Project;
  }
}
