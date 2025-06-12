import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
import { boolean } from "joi";

export interface ProjectFiscalSummaryAttributes {
    rid: string;
    project_rid: string;
    r_number: string;
    eid?: string | null;
    project_code: string;
    industry_rid: string;
    industry_name?: string | null;
    account_rid: string;
    account_fiscal_rid: string;
    program_name?: string;
    project_name?: string;
    fiscal_year: number;
    project_startdate?: Date | null;
    project_enddate?: Date | null;
    project_type: "Fixed" | "Time & Material";
    project_classification_rid?: string | null;
    project_classification_other?: string | null;
    project_client_group?: string | null;
    project_group?: string | null;
    project_status: "Active" | "Inactive";
    country?: string | null;
    region?: string | null;
    comments?: string | null;
    currency?: string | null;
    total_fte?: number | null;
    total_subcon?: number | null;
    total_effort?: number | null;
    total_cost?: number | null;
    total_effort_fte?: number | null;
    total_effort_subcon?: number | null;
    total_cost_fte?: string | null;
    total_cost_subcon?: string | null;
    total_cost_nonlabor?: string | null;
    total_fte_prj_res?: number | null;
    total_subcon_prj_res?: number | null;
    total_effort_prj_res?: number | null;
    total_cost_prj_res?: string | null;
    total_effort_fte_prj_res?: number | null;
    total_effort_subcon_prj_res?: number | null;
    total_cost_fte_prj_res?: string | null;
    total_cost_subcon_prj_res?: string | null;
    total_cost_nonlabor_prj_res?: string | null;
    total_fte_prj_task?: number | null;
    total_subcon_prj_task?: number | null;
    total_effort_prj_task?: number | null;
    total_cost_prj_task?: string | null;
    total_effort_fte_prj_task?: number | null;
    total_effort_subcon_prj_task?: number | null;
    total_cost_fte_prj_task?: string | null;
    total_cost_subcon_prj_task?: string | null;
    total_cost_nonlabor_prj_task?: string | null;
    project_point_of_contact?: string | null;
    financial_consultant?: string | null;
    technical_point_of_contact?: string | null;
    qre_potential?: number | null;
    qre_adjustment?: number | null;
    qre_final?: number | null;
    qre_cost_total?: string | null;
    qre_cost_fte?: string | null;
    qre_cost_subcon?: string | null;
    qre_cost_nonlabor?: string | null;
    rd_credits_total?: number | null;
    rd_credits_fte?: number | null;
    rd_credits_subcon?: number | null;
    rd_credits_nonlabor?: number | null;
    auto_send_ai_interaction: boolean;
    auto_access_rd?: boolean;
    assessment_status?: string | null; 
    max_ai_interaction: number | null;
    blended_rate_fte?: string | null;
    blended_rate_subcon?: string | null;
    created_datetime?: Date | null;
    modified_datetime?: Date | null;
    created_by: string;
    modified_by?: string | null;
    blended_rate?: number | null;
}

interface ProjectFiscalSummaryCreationAttributes
  extends Optional<ProjectFiscalSummaryAttributes, "rid"> {}

export class ProjectFiscalSummary
  extends Model<ProjectFiscalSummaryAttributes, ProjectFiscalSummaryCreationAttributes>
  implements ProjectFiscalSummaryAttributes 
  {
    public rid!: string;
    public project_rid!: string;
    public r_number!: string;
    public eid?: string | null;
    public project_code!: string;
    public industry_rid!: string;
    public industry_name?: string | null;
    public account_rid!: string;
    public account_fiscal_rid!: string;
    public program_name?: string;
    public project_name?: string;
    public fiscal_year!: number;
    public project_startdate?: Date | null;
    public project_enddate?: Date | null;
    public project_type!: "Fixed" | "Time & Material";
    public project_classification_rid?: string | null;
    public project_classification_other?: string | null;
    public project_client_group?: string | null;
    public project_group?: string | null;
    public project_status!: "Active" | "Inactive";
    public country?: string | null;
    public region?: string | null;
    public comments?: string | null;
    public currency?: string | null;
    public total_fte?: number | null;
    public total_subcon?: number | null;
    public total_effort?: number | null;
    public total_cost?: number | null;
    public total_effort_fte?: number | null;
    public total_effort_subcon?: number | null;
    public total_cost_fte?: string | null;
    public total_cost_subcon?: string | null;
    public total_cost_nonlabor?: string | null;
    public total_fte_prj_res?: number | null;
    public total_subcon_prj_res?: number | null;
    public total_effort_prj_res?: number | null;
    public total_cost_prj_res?: string | null;
    public total_effort_fte_prj_res?: number | null;
    public total_effort_subcon_prj_res?: number | null;
    public total_cost_fte_prj_res?: string | null;
    public total_cost_subcon_prj_res?: string | null;
    public total_cost_nonlabor_prj_res?: string | null;
    public total_fte_prj_task?: number | null;
    public total_subcon_prj_task?: number | null;
    public total_effort_prj_task?: number | null;
    public total_cost_prj_task?: string | null;
    public total_effort_fte_prj_task?: number | null;
    public total_effort_subcon_prj_task?: number | null;
    public total_cost_fte_prj_task?: string | null;
    public total_cost_subcon_prj_task?: string | null;
    public total_cost_nonlabor_prj_task?: string | null;
    public project_point_of_contact?: string | null;
    public financial_consultant?: string | null;
    public technical_point_of_contact?: string | null;
    public qre_potential?: number | null;
    public qre_adjustment?: number | null;
    public qre_final?: number | null;
    public qre_cost_total?: string | null;
    public qre_cost_fte?: string | null;
    public qre_cost_subcon?: string | null;
    public qre_cost_nonlabor?: string | null;
    public rd_credits_total?: number | null;
    public rd_credits_fte?: number | null;
    public rd_credits_subcon?: number | null;
    public rd_credits_nonlabor?: number | null;
    public auto_send_ai_interaction!: boolean;
    public auto_access_rd?: boolean;
    public assessment_status?: string | null;
    public max_ai_interaction!: number | null;
    public blended_rate_fte?: string | null;
    public blended_rate_subcon?: string | null;
    public created_datetime?: Date | null;
    public modified_datetime?: Date | null;
    public created_by!: string;
    public modified_by?: string | null;
    public blended_rate?: number | null;

    static initialize(sequelize: Sequelize, schemaName: string){
        ProjectFiscalSummary.init({
            rid: {
              type: DataTypes.UUID,
              defaultValue: UUIDV4,
              primaryKey: true  
            },
            project_rid: {
              type: DataTypes.UUID,
              allowNull: false,  
            },
            r_number: {
              type: DataTypes.STRING(20),
              allowNull: true,
              unique: true,  
            },
            eid: {
                type: DataTypes.STRING(20),
                allowNull: true
            },
            project_code: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            industry_rid: {
                type: DataTypes.UUID,
                allowNull: false
            },
            industry_name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            account_rid: {
                type: DataTypes.UUID,
                allowNull: false
            },
            account_fiscal_rid: {
                type: DataTypes.UUID,
                allowNull: false
            },
            program_name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            project_name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            fiscal_year: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            project_startdate: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            project_enddate: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            project_type: {
                type: DataTypes.ENUM('Fixed', 'Time & Material'),
                allowNull: false
            },
            project_classification_rid: {
                type: DataTypes.UUID,
                allowNull: true
            },
            project_classification_other: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            project_client_group: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            project_group: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            project_status: {
                type: DataTypes.ENUM('Active', 'Inactive'),
                allowNull: false
            },
            country: {
                type: DataTypes.UUID,
                allowNull: true
            },
            region: {
                type: DataTypes.UUID,
                allowNull: true
            },
            comments: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            currency: {
                type: DataTypes.UUID,
                allowNull: true
            },
            total_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_nonlabor: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_fte_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_subcon_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_fte_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_subcon_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_fte_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_subcon_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_nonlabor_prj_res: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_fte_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_subcon_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_fte_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_effort_subcon_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_fte_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_subcon_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            total_cost_nonlabor_prj_task: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_potential: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_adjustment: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_final: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_cost_total: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_cost_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_cost_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            qre_cost_nonlabor: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            rd_credits_total: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            rd_credits_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            rd_credits_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            rd_credits_nonlabor: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            auto_send_ai_interaction: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            auto_access_rd: {
                type: DataTypes.BOOLEAN,
                allowNull: true
            },
            assessment_status: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            max_ai_interaction: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            blended_rate_fte: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            blended_rate_subcon: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            },
            project_point_of_contact: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            technical_point_of_contact: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            financial_consultant: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            created_datetime: {
                type: DataTypes.DATE,
                allowNull: true
            },
            modified_datetime: {
                type: DataTypes.DATE,
                allowNull: true
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: false
            },
            modified_by: {
                type: DataTypes.UUID,
                allowNull: true
            },
            blended_rate: {
                type: DataTypes.DECIMAL(18,2),
                allowNull: true
            }
        },
        {
            sequelize,
            schema: schemaName ? schemaName : "public",
            tableName: "project_fiscal_summary",
            timestamps: false,
            underscored: true,
        }
    );

       return ProjectFiscalSummary;
    }
  } 

  export async function setupProjectFiscalSummarySequence(sequelize: Sequelize) {
    try {
      await sequelize.query(
        "CREATE SEQUENCE IF NOT EXISTS project_fiscal_summary_seq START 1"
      );
  
      await sequelize.query(`ALTER TABLE project_fiscal_summary
          ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_FISCAL_SUMMARY} ' || LPAD(nextval('project_fiscal_summary_seq')::text, 10, '0')`);
  
      console.log("Project fiscal summary sequence setup complete");
    } catch (error) {
      console.error("Error setting up Project fiscal summary sequence:", error);
    }
  }

