import { Model, DataTypes, Optional, Sequelize, UUIDV4 } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { ProjectResource } from "./projectResource";

interface ProjectResourceFiscalAttributes {
  rid?: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;

  project_resource_rid: string;
  account_rid: string;
  project_rid: string;
  project_fiscal_rid?: string;
  resource_rid: string;
  fiscal_year: number;

  total_hours_pro_res?: number | null;
  total_cost_pro_res?: number | null;

  status_rid: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;

  cost_project_task_level?: number | null;
  blended_cost_project_task_level?: number | null;
  blended_cost_project_resource_level?: number | null;
  effort_project_task_level?: number | null;
  total_hours_from_tasks?: number | null;
  total_cost_from_tasks?: number | null;
  total_cost_from_tasks_blended?: number | null;
  rd_percent_potential_ai?: number | null;
  rd_percent_adjustment?: number | null;
  rd_percent_final?: number | null;
  qre_fte?: number | null;
  qre_subcon?: number | null;
  qre_nonlabor?: number | null;
  qre_final?: number | null;
  rd_credits_fte_region_level?: number | null;
  rd_credits_subcon_region_level?: number | null;
  rd_credits_nonlabor_region_level?: number | null;
  rd_credits_region_level?: number | null;
  rd_credits_fte_fed_level?: number | null;
  rd_credits_subcon_fed_level?: number | null;
  rd_credits_nonlabor_fed_level?: number | null;
  rd_credits_fed_level?: number | null;
  rd_credits_total?: number | null;

  description?: string | null;
}

type ProjectResourceFiscalCreationAttributes = Optional<
  ProjectResourceFiscalAttributes,
  "rid"
>;

export class ProjectResourceFiscal
  extends Model<
    ProjectResourceFiscalAttributes,
    ProjectResourceFiscalCreationAttributes
  >
  implements ProjectResourceFiscalAttributes
{
  public rid!: string;
  public r_number!: string;
  public eid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  public project_resource_rid!: string;
  public account_rid!: string;
  public project_rid!: string;
  public project_fiscal_rid?: string;
  public resource_rid!: string;
  public fiscal_year!: number;
  
  public total_hours_pro_res?: number | null;
  public total_cost_pro_res?: number | null;

  public status_rid!: string | null;
  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public effort_project_resource_level?: number | null;
  public cost_project_resource_level?: number | null;

  public cost_project_task_level?: number | null;
  public blended_cost_project_task_level?: number | null;
  public blended_cost_project_resource_level?: number | null;
  public effort_project_task_level?: number | null;
  public total_hours_from_tasks?: number | null;
  public total_cost_from_tasks?: number | null;
  public total_cost_from_tasks_blended?: number | null;
  public rd_percent_potential_ai?: number | null;
  public rd_percent_adjustment?: number | null;
  public rd_percent_final?: number | null;
  public qre_fte?: number | null;
  public qre_subcon?: number | null;
  public qre_nonlabor?: number | null;
  public qre_final?: number | null;
  public rd_credits_fte_region_level?: number | null;
  public rd_credits_subcon_region_level?: number | null;
  public rd_credits_nonlabor_region_level?: number | null;
  public rd_credits_region_level?: number | null;
  public rd_credits_fte_fed_level?: number | null;
  public rd_credits_subcon_fed_level?: number | null;
  public rd_credits_nonlabor_fed_level?: number | null;
  public rd_credits_fed_level?: number | null;
  public rd_credits_total?: number | null;

  public description?: string | null;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectResourceFiscal.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: { type: DataTypes.STRING(120), allowNull: true },
        created_by: { type: DataTypes.STRING, allowNull: false },
        modified_by: { type: DataTypes.STRING },
        created_datetime: { type: DataTypes.DATE, allowNull: false },
        modified_datetime: { type: DataTypes.DATE },

        project_resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: false },
        resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },

        total_hours_pro_res: { type: DataTypes.DECIMAL(18, 2) },
        total_cost_pro_res: { type: DataTypes.DECIMAL(18, 2) },

        status_rid: { type: DataTypes.STRING(50) },
        country_rid: { type: DataTypes.STRING(50) },
        region_rid: { type: DataTypes.STRING(50) },
        currency_rid: { type: DataTypes.STRING(50) },

        effort_project_resource_level: { type: DataTypes.DECIMAL(18, 2) },
        cost_project_resource_level: { type: DataTypes.DECIMAL(18, 2) },

        cost_project_task_level: { type: DataTypes.DECIMAL(18, 2) },
        blended_cost_project_task_level: { type: DataTypes.DECIMAL(18, 2) },
        blended_cost_project_resource_level: { type: DataTypes.DECIMAL(18, 2) },
        effort_project_task_level: { type: DataTypes.DECIMAL(18, 2) },
        total_hours_from_tasks: { type: DataTypes.DECIMAL(18, 2) },
        total_cost_from_tasks: { type: DataTypes.DECIMAL(18, 2) },
        total_cost_from_tasks_blended: { type: DataTypes.DECIMAL(18, 2) },
        rd_percent_potential_ai: { type: DataTypes.DECIMAL(18, 2) },
        rd_percent_adjustment: { type: DataTypes.DECIMAL(18, 2) },
        rd_percent_final: { type: DataTypes.DECIMAL(18, 2) },
        qre_fte: { type: DataTypes.DECIMAL(18, 2) },
        qre_subcon: { type: DataTypes.DECIMAL(18, 2) },
        qre_nonlabor: { type: DataTypes.DECIMAL(18, 2) },
        qre_final: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_fte_region_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_subcon_region_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_nonlabor_region_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_region_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_fte_fed_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_subcon_fed_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_nonlabor_fed_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_fed_level: { type: DataTypes.DECIMAL(18, 2) },
        rd_credits_total: { type: DataTypes.DECIMAL(18, 2) },

        description: {
            type: DataTypes.STRING(2000),
            allowNull: true
        }
      },
      {
        sequelize,
        modelName: "ProjectResource",
        tableName: "project_resource_fiscal",
        schema,
        timestamps: false,
        validate: {
          bothDatesOrNeither() {
            const hasEffectiveDate =
              this.resource_effective_from_date !== null &&
              this.resource_effective_from_date !== undefined;
            const hasEndDate =
              this.resource_end_date !== null &&
              this.resource_end_date !== undefined;

            if (hasEffectiveDate !== hasEndDate) {
              throw new Error(
                "Both resource start date and end date must be provided together, or neither should be provided"
              );
            }
          },
        },
      }
    );

    ProjectResource.hasMany(ProjectResourceFiscal, {
      foreignKey: "project_resource_rid",
    });
    
    ProjectResourceFiscal.belongsTo(ProjectResource, {
      foreignKey: "project_resource_rid"
    })
    return ProjectResourceFiscal;
  }
}

export async function setupProjectResourceFiscalSequence(
    sequelize: Sequelize,
    schemaName: string
  ) {
    try {
      await sequelize.query(
        `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resource_fiscal_seq START 1`
      );
  
      await sequelize.query(`ALTER TABLE "${schemaName}".project_resource_fiscal
        ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_RESOURCE_FISCAL}-' || LPAD(nextval('"${schemaName}".project_resource_fiscal_seq')::text, 10, '0')`);
  
      console.log("Project sequence setup complete");
    } catch (error) {
      console.error("Error setting up Project sequence:", error);
    }
  }