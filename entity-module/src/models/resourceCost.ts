import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { Resources } from "./resource";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceCostAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  account_rid: string;
  resource_type: string;
  resource_rid: string;
  resource_number: string;
  resource_code: string;
  effective_from?: Date | null;
  end_date?: Date | null;
  // cost?: number;
  // cost_type?: string;
  // annual_cost?: number;
  // semi_annual_cost?: number;
  // monthly_cost?: number;
  // weekly_cost?: number;
  // bi_weekly_cost?: number;
  // daily_cost?: number;
  // hourly_cost?: number;
  effort_in_hrs?: number;
  salary?: number;
  bonus?: number;
  insurance?: number;
  deductions?: number;
  net_resource_cost: number;
  resource_cost?: number;
  currency_rid?: string;
  fiscal_year: number;
  status?: string;
  comments?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface ResourceCostCreationAttributes
  extends Optional<ResourceCostAttributes, "rid"> {}

export class ResourceCost
  extends Model<ResourceCostAttributes, ResourceCostCreationAttributes>
  implements ResourceCostAttributes
{
  rid!: string;
  r_number?: string;
  eid?: string;
  account_rid!: string;
  resource_type!: string;
  resource_rid!: string;
  resource_number!: string;
  resource_code!: string;
  effective_from?: Date;
  end_date?: Date;
  // cost?: number;
  // cost_type?: string;
  fiscal_year!: number;
  // annual_cost?: number;
  // semi_annual_cost?: number;
  // monthly_cost?: number;
  // weekly_cost?: number;
  // bi_weekly_cost?: number;
  // daily_cost?: number;
  // hourly_cost?: number;
  effort_in_hrs?: number;
  salary?: number;
  bonus?: number;
  insurance?: number;
  deductions?: number;
  net_resource_cost!: number;
  resource_cost?: number;
  currency_rid?: string;
  status?: string;
  comments?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ResourceCost.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique:true,
        },
        eid: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        resource_type: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        resource_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        resource_code: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        resource_number: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        effective_from: {
          type: DataTypes.DATE,
          allowNull: true,
          validate: {
            notFuture(value: Date) {
              if (value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const inputDate = new Date(value);
                inputDate.setHours(0, 0, 0, 0);

                if (inputDate > today) {
                  throw new Error("Effective date cannot be in the future");
                }
              }
            },
          },
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: true,
          validate: {
            isAfterEffectiveDate(value: Date) {
              if (value && this.effective_from) {
                const effectiveDate = new Date(this.effective_from as Date);
                effectiveDate.setHours(0, 0, 0, 0);
                const endDate = new Date(value);
                endDate.setHours(0, 0, 0, 0);

                if (endDate <= effectiveDate) {
                  throw new Error(
                    "End date must be greater than effective date"
                  );
                }
              }
            },
          },
        },
        // cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // cost_type: {
        //   type: DataTypes.STRING(255),
        //   allowNull: true,
        // },
        // annual_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // semi_annual_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // monthly_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // weekly_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // bi_weekly_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // daily_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
        // hourly_cost: {
        //   type: DataTypes.DECIMAL(18, 2),
        //   allowNull: true,
        // },
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
        net_resource_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        resource_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        effort_in_hrs: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        currency_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(255),
          defaultValue: "active",
        },
        comments: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceCost",
        tableName: "resource_cost",
        timestamps: false,
        validate: {
          bothDatesOrNeither() {
            const hasEffectiveDate = this.effective_from !== null && this.effective_from !== undefined;
            const hasEndDate = this.end_date !== null && this.end_date !== undefined;
            
            if (hasEffectiveDate !== hasEndDate) {
              throw new Error("Both effective date and end date must be provided together, or neither should be provided");
            }
          }
        },
      }
    );

    // ResourceCost model
    ResourceCost.belongsTo(Resources, {
      foreignKey: "resource_rid",
      targetKey: "rid",
    });

    // Resource model
    Resources.hasMany(ResourceCost, {
      foreignKey: "resource_rid",
      sourceKey: "rid",
    });
    return ResourceCost;
  }
}


export async function setupResourceCostSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_cost_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_cost
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_COST} ' || LPAD(nextval('"${schemaName}".resource_cost_seq')::text, 10, '0')`);
    
    console.log('Resource cost sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource cost sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
