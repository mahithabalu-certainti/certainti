import { Model, DataTypes, Sequelize, UUIDV4 } from "sequelize";
import sequelize from "../config/dataSource";

export class Resources extends Model {
  public id!: string;
  public resource_number!: string;
  public resource_ref_id!: string;
  public resource_type!: "Full-time" | "Contract";
  public resource_first_name?: string;
  public resource_middle_name?: string;
  public resource_last_name?: string;
  public resource_full_name?: string;
  public resource_org_name?: string;
  public resource_role?: string;
  public fiscal_year!: number;
  public resource_email?: string;
  public resource_mobile?: string;
  public country?: string;
  public region?: string;
  public currency?: string;
  public resource_effective_from?: Date;
  public resource_end_date?: Date;
  public designation?: string;
  public manager_name?: string;
  public total_years_experience?: number;
  public total_years_in_org?: number;
  public description?: string;
}

Resources.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    resource_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    resource_ref_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    resource_type: {
      type: DataTypes.ENUM("Full-time", "Contract"),
      allowNull: false,
    },
    resource_first_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: [2, 100],
      },
    },
    resource_middle_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: [0, 100],
      },
    },
    resource_last_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: [2, 100],
      },
    },
    resource_full_name: {
      type: DataTypes.STRING(200),
      validate: {
        len: [3, 200],
      },
    },
    resource_org_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: [3, 100],
      },
    },
    resource_role: {
      type: DataTypes.STRING(100),
      validate: {
        len: [4, 100],
      },
    },
    fiscal_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resource_email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true,
        len: [0, 255],
      },
    },
    resource_mobile: {
      type: DataTypes.STRING(20),
      validate: {
        len: [0, 15],
      },
    },
    country: {
      type: DataTypes.STRING(10),
    },
    region: {
      type: DataTypes.STRING(50),
    },
    currency: {
      type: DataTypes.STRING(3),
    },
    resource_effective_from: {
      type: DataTypes.DATE,
      validate: {
        isBeforeToday(value: Date) {
          if (value && new Date(value) > new Date()) {
            throw new Error("Effective from date cannot be in the future.");
          }
        },
      },
    },
    resource_end_date: {
      type: DataTypes.DATE,
    },
    designation: {
      type: DataTypes.STRING(100),
      validate: {
        len: [4, 100],
      },
    },
    manager_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: [3, 100],
      },
    },
    total_years_experience: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },
    total_years_in_org: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },
    description: {
      type: DataTypes.STRING(1000),
    },
  },
  {
    sequelize,
    tableName: "resources",
    timestamps: true,
    underscored: true,
  }
);

export default Resources;
