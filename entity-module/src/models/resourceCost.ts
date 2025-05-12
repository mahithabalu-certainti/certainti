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
  resource_ref_id: string;
  effective_date?: Date | null;
  end_date?: Date | null;
  cost?: number;
  cost_type?: string;
  annual_cost?: number;
  semi_annual_cost?: number;
  monthly_cost?: number;
  weekly_cost?: number;
  bi_weekly_cost?: number;
  daily_cost?: number;
  hourly_cost?: number;
  currency_rid?: string;
  status?: string;
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
  resource_ref_id!: string;
  effective_date?: Date;
  end_date?: Date;
  cost?: number;
  cost_type?: string;
  annual_cost?: number;
  semi_annual_cost?: number;
  monthly_cost?: number;
  weekly_cost?: number;
  bi_weekly_cost?: number;
  daily_cost?: number;
  hourly_cost?: number;
  currency_rid?: string;
  status?: string;
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
          type: DataTypes.STRING(255),
          allowNull: true,
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
        resource_ref_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        resource_number: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        effective_date: {
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
              if (value && this.effective_date) {
                const effectiveDate = new Date(this.effective_date as Date);
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
        cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        cost_type: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        annual_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        semi_annual_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        monthly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        weekly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        bi_weekly_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        daily_cost: {
          type: DataTypes.DECIMAL(18, 2),
          allowNull: true,
        },
        hourly_cost: {
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
            const hasEffectiveDate = this.effective_date !== null && this.effective_date !== undefined;
            const hasEndDate = this.end_date !== null && this.end_date !== undefined;
            
            if (hasEffectiveDate !== hasEndDate) {
              throw new Error("Both effective date and end date must be provided together, or neither should be provided");
            }
          }
        },
        hooks: {
          beforeCreate: async (resourceCost: ResourceCost) => {
            // Generate r_number if not provided
            if (!resourceCost.r_number) {
              // Get the latest cost number and increment it
            const latestAccount = await ResourceCost.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }
              resourceCost.r_number = `${R_NUMBER_PREFIX.RESOURCE_COST} ${nextNumber}`;
            }
          },
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
