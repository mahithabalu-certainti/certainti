import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

export interface ResourcesAttributes {
  rid?: string;
  eid?: string;
  r_number?: string;
  resource_ref_id: string;
  resource_type: "FullTime" | "Contract";
  account_rid: string;
  resource_firstname?: string;
  resource_middlename?: string;
  resource_lastname?: string;
  resource_fullname?: string;
  resource_orgname?: string;
  resource_role?: string;
  fiscal_year?: number;
  resource_email?: string;
  resource_mobile?: string;
  country?: string;
  region?: string;
  currency?: string;
  cost_frequency?:
    | "Annual"
    | "Semi-Annual"
    | "Monthly"
    | "Bi-Weekly"
    | "Weekly"
    | "Daily"
    | "Hourly"
    | null;
  cost?: number;
  resource_startdate?: Date | null;
  resource_enddate?: Date | null;
  designation?: string;
  manager_name?: string;
  total_years_experience?: number | null;
  total_years_in_org?: number | null;
  resource_desc?: string;
  resource_status?: "Active" | "Inactive";
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by: string;
  modified_by?: string | null;
}

interface ResourcesCreationAttributes
  extends Optional<ResourcesAttributes, "rid"> {}

export class Resources
  extends Model<ResourcesAttributes, ResourcesCreationAttributes>
  implements ResourcesAttributes
{
  public rid?: string;
  public eid?: string;
  public r_number?: string;
  public resource_ref_id!: string;
  public resource_type!: "FullTime" | "Contract";
  public fiscal_year!: number;
  public resource_firstname?: string;
  public resource_middlename?: string;
  public resource_lastname?: string;
  public resource_fullname?: string;
  public resource_orgname?: string;
  public resource_role?: string;
  public resource_email?: string;
  public resource_mobile?: string;
  public country?: string;
  public region?: string;
  public currency?: string;
  public cost_frequency?:
  | "Annual"
  | "Semi-Annual"
  | "Monthly"
  | "Bi-Weekly"
  | "Weekly"
  | "Daily"
  | "Hourly" 
    | null;
  public cost?: number;
  public resource_startdate?: Date;
  public resource_enddate?: Date;
  public designation?: string;
  public manager_name?: string;
  public total_years_experience?: number;
  public total_years_in_org?: number;
  public resource_desc?: string;
  public resource_status?: "Active" | "Inactive";
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by!: string;
  public modified_by?: string;
  public account_rid!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return Resources.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        eid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        resource_ref_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        resource_type: {
          type: DataTypes.ENUM("FullTime", "Contract"),
          allowNull: false,
        },
        resource_firstname: {
          type: DataTypes.STRING(100),
          validate: {
            len: [0, 100],
          },
          allowNull: true,
        },
        resource_middlename: {
          type: DataTypes.STRING(100),
          validate: {
            len: [0, 100],
          },
          allowNull: true,
        },
        resource_lastname: {
          type: DataTypes.STRING(100),
          validate: {
            len: [0, 100],
          },
          allowNull: true,
        },
        resource_fullname: {
          type: DataTypes.STRING(200),
          validate: {
            len: [3, 200],
          },
          allowNull: true,
        },
        resource_orgname: {
          type: DataTypes.STRING(100),
          validate: {
            len: [3, 100],
          },
          allowNull: true,
        },
        resource_role: {
          type: DataTypes.STRING(100),
          validate: {
            len: [4, 100],
          },
          allowNull: true,
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
          allowNull: true,
        },
        resource_mobile: {
          type: DataTypes.STRING(20),
          validate: {
            len: [0, 15],
          },
          allowNull: true,
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
        cost_frequency: {
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
        cost: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        resource_startdate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        resource_enddate: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        designation: {
          type: DataTypes.STRING(100),
          validate: {
            len: [4, 100],
          },
          allowNull: true,
        },
        manager_name: {
          type: DataTypes.STRING(100),
          validate: {
            len: [3, 100],
          },
          allowNull: true,
        },
        total_years_experience: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        total_years_in_org: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        resource_desc: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
        resource_status: {
          type: DataTypes.ENUM("Active", "Inactive"),
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
        tableName: "resources",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("created_datetime", new Date());
            resources.setDataValue("modified_datetime", new Date());
          },
          beforeValidate: async (account) => {
            const latestAccount = await Resources.findAll();
            const serialNumber = latestAccount ? latestAccount.length + 1 : 1;

            const accountCode = `RES${serialNumber
              .toString()
              .padStart(4, "0")}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
