import { Model, DataTypes, Sequelize, UUIDV4 } from "sequelize";
import sequelize from "../config/dataSource";
import Resources from "./Resource";

export class ResourceCost extends Model {
  public id!: string;
  public resource_id!: string;
  public resource_cost_number!: string;
  public resource_ref_id!: string;
  public currency!: string;
  public start_date!: Date;
  public end_date?: Date;
  public annual_compensation?: number;
  public monthly_compensation?: number;
  public weekly_compensation?: number;
  public daily_compensation?: number;
  public hourly_compensation?: number;
  public status!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public created_by?: string;
  public updated_by?: string;
}

ResourceCost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    resource_cost_number: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    resource_ref_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notInFuture(value: Date) {
          if (new Date(value) > new Date()) {
            throw new Error("Start date cannot be in the future");
          }
        },
      },
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isAfterStartDate(value: Date) {
          if (value && new Date(value) <= new Date(this.start_date as Date)) {
            throw new Error("End date must be later than start date");
          }
        },
      },
    },
    annual_compensation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isPositive(value: number) {
          if (value !== null && value < 0) {
            throw new Error("Compensation must be a positive number");
          }
        },
      },
    },
    monthly_compensation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isPositive(value: number) {
          if (value !== null && value < 0) {
            throw new Error("Compensation must be a positive number");
          }
        },
      },
    },
    weekly_compensation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isPositive(value: number) {
          if (value !== null && value < 0) {
            throw new Error("Compensation must be a positive number");
          }
        },
      },
    },
    daily_compensation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isPositive(value: number) {
          if (value !== null && value < 0) {
            throw new Error("Compensation must be a positive number");
          }
        },
      },
    },
    hourly_compensation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isPositive(value: number) {
          if (value !== null && value < 0) {
            throw new Error("Compensation must be a positive number");
          }
        },
      },
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: "Active",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "resource_cost",
    sequelize,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: (record: ResourceCost) => {
        // Generate resource_cost_number with prefix 'RC' followed by timestamp and random chars
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        record.resource_cost_number = `RC-${timestamp}-${random}`;
      },
    },
  }
);

// ResourceCost model
ResourceCost.belongsTo(Resources, {
  foreignKey: "resource_ref_id",
  targetKey: "resource_ref_id",
});

// Resource model
Resources.hasMany(ResourceCost, {
  foreignKey: "resource_ref_id",
  sourceKey: "resource_ref_id",
});

export default ResourceCost;
