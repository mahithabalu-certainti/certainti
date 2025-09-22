import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

export interface AccountFiscalRegionAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  fiscal_year: number;
  account_rid: string;
  parent_account_rid?: string | null;
  tax_claim_level?: string | null;
  region_rid?: string | null;
  blended_rate_fte?: number | null;
  blended_rate_subcon?: number | null;
  total_projects: number | null;
  total_fte?: number | null;
  total_subcon?: number | null;
  total_nonlabor?: number | null;
  total_project_hours_fte?: number | null;
  total_project_hours_subcon?: number | null;
  total_project_hours?: number | null;
  total_project_cost_fte?: number | null;
  total_project_cost_subcon?: number | null;
  total_project_cost_nonlabor?: number | null;
  total_project_cost?: number | null;
  total_project_qre_fte?: number | null;
  total_project_qre_subcon?: number | null;
  total_projects_qre?: number | null;
  total_projects_rd_credits_fte?: number | null;
  total_projects_rd_credits_subcon?: number | null;
  total_projects_rd_credits?: number | null;
  total_qualifying_projects_fed?: number | null;
  qualifying_fte_fed?: number | null;
  qualifying_subcon_fed?: number | null;
  qualifying_project_hours_fte_fed?: number | null;
  qualifying_project_hours_subcon_fed?: number | null;
  qualifying_project_hours_fed?: number | null;
  qualifying_project_cost_fte_fed?: number | null;
  qualifying_project_cost_subcon_fed?: number | null;
  qualifying_project_cost_nonlabor_fed?: number | null;
  qualifying_project_cost_fed?: number | null;
  qualifying_project_qre_fte_fed?: number | null;
  qualifying_project_qre_subcon_fed?: number | null;
  qualifying_project_qre_fed?: number | null;
  qualifying_project_rd_credits_fte_fed?: number | null;
  qualifying_project_rd_credits_subcon_fed?: number | null;
  qualifying_project_rd_credits_fed?: number | null;

  total_project_res_hours?: number | null;
  total_project_res_hours_fte?: number | null;
  total_project_res_hours_subcon?: number | null;

  total_project_res_cost?: number | null;
  total_project_res_cost_fte?: number | null;
  total_project_res_cost_subcon?: number | null;
  total_project_res_cost_nonlabor?: number | null;

  total_project_task_hours?: number | null;
  total_project_task_hours_fte?: number | null;
  total_project_task_hours_subcon?: number | null;

  total_project_task_cost?: number | null;
  total_project_task_cost_fte?: number | null;
  total_project_task_cost_subcon?: number | null;

  created_datetime: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface AccountFiscalRegionCreationAttributes
  extends Optional<AccountFiscalRegionAttributes, "rid"> {}

export class AccountFiscalRegion
  extends Model<
    AccountFiscalRegionAttributes,
    AccountFiscalRegionCreationAttributes
  >
  implements AccountFiscalRegionAttributes
{
  public rid!: string;
  public r_number!: string;
  public eid?: string;
  public fiscal_year!: number;
  public account_rid!: string;
  public parent_account_rid?: string | null;
  public tax_claim_level?: string | null;
  public region_rid?: string | null;

  public blended_rate_fte?: number | null;
  public blended_rate_subcon?: number | null;

  public total_projects!: number | null;
  public total_fte?: number | null;
  public total_subcon?: number | null;
  public total_nonlabor?: number | null;

  public total_project_hours_fte?: number | null;
  public total_project_hours_subcon?: number | null;
  public total_project_hours?: number | null;

  public total_project_cost_fte?: number | null;
  public total_project_cost_subcon?: number | null;
  public total_project_cost_nonlabor?: number | null;
  public total_project_cost?: number | null;

  public total_project_qre_fte?: number | null;
  public total_project_qre_subcon?: number | null;
  public total_projects_qre?: number | null;

  public total_projects_rd_credits_fte?: number | null;
  public total_projects_rd_credits_subcon?: number | null;
  public total_projects_rd_credits?: number | null;

  public total_qualifying_projects_fed?: number | null;
  public qualifying_fte_fed?: number | null;
  public qualifying_subcon_fed?: number | null;

  public qualifying_project_hours_fte_fed?: number | null;
  public qualifying_project_hours_subcon_fed?: number | null;
  public qualifying_project_hours_fed?: number | null;

  public qualifying_project_cost_fte_fed?: number | null;
  public qualifying_project_cost_subcon_fed?: number | null;
  public qualifying_project_cost_nonlabor_fed?: number | null;
  public qualifying_project_cost_fed?: number | null;

  public qualifying_project_qre_fte_fed?: number | null;
  public qualifying_project_qre_subcon_fed?: number | null;
  public qualifying_project_qre_fed?: number | null;

  public qualifying_project_rd_credits_fte_fed?: number | null;
  public qualifying_project_rd_credits_subcon_fed?: number | null;
  public qualifying_project_rd_credits_fed?: number | null;

  public total_project_res_hours?: number | null;
  public total_project_res_hours_fte?: number | null;
  public total_project_res_hours_subcon?: number | null;

  public total_project_res_cost?: number | null;
  public total_project_res_cost_fte?: number | null;
  public total_project_res_cost_subcon?: number | null;
  public total_project_res_cost_nonlabor?: number | null;

  public total_project_task_hours?: number | null;
  public total_project_task_hours_fte?: number | null;
  public total_project_task_hours_subcon?: number | null;

  public total_project_task_cost?: number | null;
  public total_project_task_cost_fte?: number | null;
  public total_project_task_cost_subcon?: number | null;

  public created_datetime!: Date;
  public modified_datetime?: Date;

  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    const model = AccountFiscalRegion.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: {
          type: DataTypes.STRING(120),
          allowNull: true,
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
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          // allowNull: true,
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        region_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        total_projects: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_fte: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_subcon: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_nonlabor: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        total_project_hours_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_hours_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_hours: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_cost_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_cost_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_cost_nonlabor: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_qre_fte: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        total_project_qre_subcon: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        total_projects_qre: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        total_projects_rd_credits_fte: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_projects_rd_credits_subcon: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_projects_rd_credits: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_qualifying_projects_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_fte_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_subcon_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_hours_fte_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_hours_subcon_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_hours_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_cost_fte_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_cost_subcon_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_cost_nonlabor_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_cost_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_qre_fte_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_qre_subcon_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_qre_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_rd_credits_fte_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_rd_credits_subcon_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        qualifying_project_rd_credits_fed: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        total_project_res_hours: DataTypes.DECIMAL(18, 2),
        total_project_res_hours_fte: DataTypes.DECIMAL(18, 2),
        total_project_res_hours_subcon: DataTypes.DECIMAL(18, 2),

        total_project_res_cost: DataTypes.DECIMAL(18, 2),
        total_project_res_cost_fte: DataTypes.DECIMAL(18, 2),
        total_project_res_cost_subcon: DataTypes.DECIMAL(18, 2),
        total_project_res_cost_nonlabor: DataTypes.DECIMAL(18, 2),

        total_project_task_hours: DataTypes.DECIMAL(18, 2),
        total_project_task_hours_fte: DataTypes.DECIMAL(18, 2),
        total_project_task_hours_subcon: DataTypes.DECIMAL(18, 2),

        total_project_task_cost: DataTypes.DECIMAL(18, 2),
        total_project_task_cost_fte: DataTypes.DECIMAL(18, 2),
        total_project_task_cost_subcon: DataTypes.DECIMAL(18, 2),
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "account_fiscal_region",
        timestamps: false,
        underscored: true,
      }
    );
    return model;
  }

  static associate(models: any) {
    AccountFiscalRegion.belongsTo(models.AccountDetails, {
      foreignKey: "account_rid",
      targetKey: "account_rid",
      as: "account_fiscal_region_account",
    });
  }
}

export async function setupAccountFiscalRegionSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".account_fiscal_region_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".account_fiscal_region
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.ACCOUNT_FISCAL_REGION}-' || LPAD(nextval('"${schemaName}".account_fiscal_region_seq')::text, 10, '0')`);

    console.log("Project sequence setup complete");
  } catch (error) {
    console.error("Error setting up Project sequence:", error);
  }
}
