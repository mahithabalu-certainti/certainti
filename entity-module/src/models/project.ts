import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

export interface ProjectAttributes {
  rid?: string;
  r_number?: string;
  eid?: string;
  project_ref_id: string;
  industry: string;
  account_rid: string;
  account_fiscal_rid: string | null;
  program_name?: string | null;
  client_organization: string;
  project_start_date?: Date | null;
  project_end_date?: Date | null;
  project_type: "Fixed" | "Time & Material" | null;
  project_classification?: string | null;
  project_client_group?: string | null;
  project_group?: string | null;
  project_summary?: string | null;
  status?: "Active" | "Inactive";
  fiscal_year: number;
  country?: string | null;
  region?: string | null;
  currency?: string | null;
  project_manager: string;
  project_lead: string;
  spoc_name: string;
  spoc_email?: string | null;
  spoc_mobile?: string | null;
  project_tpc_name?: string | null;
  project_tpc_email?: string | null;
  project_tpc_mobile?: string | null;
  project_cc_list?: string | null;
  total_effort?: number;
  total_cost?: number;
  total_fte?: number;
  total_subcon?: number;
  total_non_labor_cost?: number;
  total_fte_effort?: number;
  total_sub_con_effort?: number;
  total_fte_cost?: number;
  total_sub_con_cost?: number;
  last_rd_ai_assess_on?: Date | null;
  last_rd_ai_assess_by?: string | null;
  auto_send_ai_interaction?: boolean;
  auto_access_rd?: boolean;
  max_ai_interaction?: number;
  blended_rate_fte?: string | null;
  blended_rate_sub_con?: string | null;
  project_description?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
}

interface ProjectCreationAttributes
  extends Optional<ProjectAttributes, "rid"> {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public rid?: string;
  public project_ref_id!: string;
  public account_fiscal_rid!: string;
  public account_rid!: string;
  public industry!: string;
  public program_name?: string | null;
  public client_organization!: string;
  public project_start_date?: Date | null;
  public project_end_date?: Date | null;
  public project_type!: "Fixed" | "Time & Material";
  public project_classification?: string | null;
  public project_client_group?: string | null;
  public project_group?: string | null;
  public project_summary?: string | null;
  public status?: "Active" | "Inactive";
  public fiscal_year!: number;
  public country?: string | null;
  public region?: string | null;
  public currency?: string | null;
  public project_manager!: string;
  public project_lead!: string;
  public spoc_name!: string;
  public spoc_email!: string | null;
  public spoc_mobile!: string | null;
  public project_tpc_name?: string | null;
  public project_tpc_email?: string | null;
  public project_tpc_mobile?: string | null;
  public project_cc_list?: string | null;
  public total_effort?: number;
  public total_cost?: number;
  public total_fte?: number;
  public total_subcon?: number;
  public total_non_labor_cost?: number;
  public total_fte_effort?: number;
  public total_sub_con_effort?: number;
  public total_fte_cost?: number;
  public total_sub_con_cost?: number;
  public last_rd_ai_assess_on?: Date | null;
  public last_rd_ai_assess_by?: string | null;
  public auto_send_ai_interaction?: boolean;
  public auto_access_rd?: boolean;
  public max_ai_interaction?: number;
  public blended_rate_fte?: string | null;
  public blended_rate_sub_con?: string | null;
  public project_description?: string | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return Project.init(
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
        project_ref_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        industry: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        program_name: DataTypes.STRING(100),
        client_organization: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        project_start_date: DataTypes.DATE,
        project_end_date: DataTypes.DATE,
        project_type: {
          type: DataTypes.ENUM("Fixed", "Time & Material"),
          allowNull: false,
        },
        project_classification: DataTypes.STRING(100),
        project_client_group: DataTypes.STRING(200),
        project_group: DataTypes.STRING(150),
        project_summary: DataTypes.STRING(1000),
        status: {
          type: DataTypes.ENUM("Active", "Inactive"),
          allowNull: true,
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
        project_manager: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        project_lead: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        spoc_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        spoc_email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        spoc_mobile: {
          type: DataTypes.STRING(15),
          allowNull: true,
        },
        project_tpc_name: DataTypes.STRING(100),
        project_tpc_email: DataTypes.STRING(255),
        project_tpc_mobile: DataTypes.STRING(15),
        project_cc_list: DataTypes.TEXT,
        total_effort: DataTypes.DOUBLE,
        total_cost: DataTypes.DECIMAL(13, 2),
        total_fte: DataTypes.DOUBLE,
        total_subcon: DataTypes.DOUBLE,
        total_non_labor_cost: DataTypes.DECIMAL(13, 2),
        total_fte_effort: DataTypes.DOUBLE,
        total_sub_con_effort: DataTypes.DOUBLE,
        total_fte_cost: DataTypes.DECIMAL(13, 2),
        total_sub_con_cost: DataTypes.DECIMAL(13, 2),
        last_rd_ai_assess_on: DataTypes.DATE,
        last_rd_ai_assess_by: DataTypes.UUID,
        auto_send_ai_interaction: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        auto_access_rd: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        max_ai_interaction: DataTypes.INTEGER,
        blended_rate_fte: DataTypes.STRING,
        blended_rate_sub_con: DataTypes.STRING,
        project_description: DataTypes.STRING(2000),
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
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeValidate: async (account) => {
            const latestAccount = await Project.findAll();
            const serialNumber = latestAccount ? latestAccount.length + 1 : 1;

            const accountCode = `PRO${serialNumber
              .toString()
              .padStart(4, "0")}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
