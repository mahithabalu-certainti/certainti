import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceFiscalAttributes {
  rid?: string;
  eid?: string;
  account_rid: string;
  r_number?: string;
  resource_rid: string;
  resource_type: "Full-Time" | "Sub Con" | "Non-Labor";
  fiscal_year?: number;
  country_rid?: string | null;
  country_region_rid?: string | null;
  cost_type?:
    | "Annual"
    | "Semi-Annual"
    | "Monthly"
    | "Bi-Weekly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | null;
  annual_cost?: number;
  semiannual_cost?: number;
  monthly_cost?: number;
  weekly_cost?: number;
  daily_cost?: number;
  hourly_cost?: number;
  bi_weekly_cost?: number;
  total_cost_for_year_project?: number;
  total_cost_for_year_project_resource_level?: number;
  total_cost_for_year_project_task_level?: number;
  total_effort_for_year_project?: number;
  total_effort_for_year_project_resource_level?: number;
  total_effort_for_year_project_task_level?: number;
  effective_date?: Date | null;
  end_date?: Date | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
}

interface ResourceFiscalCreationAttributes
  extends Optional<ResourceFiscalAttributes, "rid"> {}

export class ResourceFiscal
  extends Model<ResourceFiscalAttributes, ResourceFiscalCreationAttributes>
  implements ResourceFiscalAttributes
{
  public rid?: string;
  public eid?: string;
  public account_rid!: string;
  public r_number?: string;
  public resource_rid!: string;
  public resource_type!: "Full-Time" | "Sub Con" | "Non-Labor";
  public fiscal_year?: number;
  public country_rid?: string | null;
  public country_region_rid?: string | null;
  public cost_type?:
    | "Annual"
    | "Semi-Annual"
    | "Monthly"
    | "Bi-Weekly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | null;
  public annual_cost?: number;
  public semiannual_cost?: number;
  public monthly_cost?: number;
  public weekly_cost?: number;
  public daily_cost?: number;
  public hourly_cost?: number;
  public bi_weekly_cost?: number;
  public total_cost_for_year_project?: number;
  public total_cost_for_year_project_resource_level?: number;
  public total_cost_for_year_project_task_level?: number;
  public total_effort_for_year_project?: number;
  public total_effort_for_year_project_resource_level?: number;
  public total_effort_for_year_project_task_level?: number;
  public effective_date?: Date | null;
  public end_date?: Date | null;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string | null;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return ResourceFiscal.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        eid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        r_number: {
          type: DataTypes.STRING(250),
          allowNull: true,
          unique: true,
        },
        resource_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        resource_type: {
          type: DataTypes.ENUM("Full-Time", "Sub Con", "Non-Labor"),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        country_region_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        cost_type: {
          type: DataTypes.ENUM(
            "Annual",
            "Semi-Annual",
            "Monthly",
            "Bi-Weekly",
            "Weekly",
            "Daily",
            "Hourly"
          ),
          allowNull: true,
        },
        annual_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        semiannual_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        monthly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        weekly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        bi_weekly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value!== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        daily_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        hourly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_cost_for_year_project: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_cost_for_year_project_resource_level: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_cost_for_year_project_task_level: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_effort_for_year_project: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_effort_for_year_project_resource_level: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        total_effort_for_year_project_task_level: {
          type: DataTypes.DECIMAL(14, 2),
          allowNull: true,
          validate: {
            isPositive(value: number) {
              if (value !== null && value < 0) {
                throw new Error("Compensation must be a positive number");
              }
            },
          },
        },
        effective_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        end_date: {
          type: DataTypes.DATE,
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
        tableName: "resource_fiscal",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("created_datetime", new Date());
            resources.setDataValue("modified_datetime", new Date());
          },
          beforeValidate: async (account) => {
            // Get the latest resource fiscal number and increment it
            const latestAccount = await ResourceFiscal.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }
            const accountCode = `${R_NUMBER_PREFIX.RESOURCE_FISCAL} ${nextNumber}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
