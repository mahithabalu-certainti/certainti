import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

interface ProjectResourceAttributes {
  rid?: string;
  r_number?: string;
  eid?: string | null;
  created_by: string;
  modified_by?: string;
  created_datetime: Date;
  modified_datetime?: Date;

  account_rid: string;
  project_rid: string;
  resource_rid: string;
  project_code: string;
  project_resource_code: string;
  fiscal_year: number;

  start_date?: Date | null;
  end_date?: Date | null;

  resource_code: string;
  resource_name?: string | null;
  resource_type_rid: string | null;
  designation?: string | null;
  resource_role?: string | null;
  assigned_skill_role_type_rid?: string | null,

  total_hours_pro_res?: number | null;
  total_cost_pro_res?: number | null;

  status_rid: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  currency_rid?: string | null;

  resource_orgname?: string | null;

  effort_project_resource_level?: number | null;
  cost_project_resource_level?: number | null;

  qre_final?: number | null;
  qre_percent?: number | null;

  salary?: number | null; 
  bonus?: number | null; 
  insurance?: number | null; 
  deductions?: number | null;

  description?: string | null;
}

type ProjectResourceCreationAttributes = Optional<
  ProjectResourceAttributes,
  "rid"
>;

export class ProjectResource
  extends Model<ProjectResourceAttributes, ProjectResourceCreationAttributes>
  implements ProjectResourceAttributes
{
  public rid!: string;
  public r_number!: string;
  public eid!: string | null;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime!: Date;
  public modified_datetime?: Date;

  public account_rid!: string;
  public project_rid!: string;
  public resource_rid!: string;
  public fiscal_year!: number;
  public project_resource_code!: string;
  public project_code!: string;

  public start_date?: Date | null;
  public end_date?: Date | null;

  public resource_code!: string;
  public resource_name?: string | null;
  public resource_type_rid!: string | null;
  public designation?: string | null;
  public resource_role?: string | null;
  public assigned_skill_role_type_rid?: string | null;

  public total_hours_pro_res?: number | null;
  public total_cost_pro_res?: number | null;

  public status_rid!: string | null;
  public country_rid?: string | null;
  public region_rid?: string | null;
  public currency_rid?: string | null;

  public resource_orgname?: string | null;

  public effort_project_resource_level?: number | null;
  public cost_project_resource_level?: number | null;

  public qre_final?: number | null;
  public qre_percent?: number | null;

  public salary?: number | null;
  public insurance?: number | null;
  public deductions?: number | null;
  public bonus?: number | null;

  public description?: string | null;

  static initialize(sequelize: Sequelize, schema: string) {
    ProjectResource.init(
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

        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: false },
        resource_rid: { type: DataTypes.STRING(50), allowNull: false },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: false },
        project_resource_code: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        project_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },

        start_date: { type: DataTypes.DATE },
        end_date: { type: DataTypes.DATE },

        resource_code: { type: DataTypes.STRING(100), allowNull: false },
        resource_name: { type: DataTypes.STRING(200) },
        resource_type_rid: { type: DataTypes.STRING(100), allowNull: false },
        designation: { type: DataTypes.STRING(200) },
        resource_role: { type: DataTypes.STRING(200) },

        assigned_skill_role_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        total_hours_pro_res: { type: DataTypes.DECIMAL(18, 2) },
        total_cost_pro_res: { type: DataTypes.DECIMAL(18, 2) },

        status_rid: { type: DataTypes.STRING(50) },
        country_rid: { type: DataTypes.STRING(50) },
        region_rid: { type: DataTypes.STRING(50) },
        currency_rid: { type: DataTypes.STRING(50) },

        resource_orgname: { type: DataTypes.STRING(200) },

        effort_project_resource_level: { type: DataTypes.DECIMAL(18, 2) },
        cost_project_resource_level: { type: DataTypes.DECIMAL(18, 2) },

        qre_final: {
          type: DataTypes.DECIMAL(18, 2),
        },
        qre_percent: {
          type: DataTypes.DECIMAL(5, 2),
        },

        salary: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        bonus: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        insurance: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        deductions: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },

        description: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "ProjectResource",
        tableName: "project_resource",
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

    return ProjectResource;
  }
}

export async function setupProjectResourceSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_resources_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".project_resources
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_RESOURCE}-' || LPAD(nextval('"${schemaName}".project_resources_seq')::text, 10, '0')`);

    console.log("Project sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project sequence:", error);
  }
}
