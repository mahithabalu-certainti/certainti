import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

export interface ResourcesAttributes {
  rid?: string;
  eid?: string;
  r_number?: string;
  resource_ref_id: string;
  resource_type: "Full-Time" | "Sub Con" | "Non-Labor";
  account_rid: string;
  resource_fullname?: string | null;
  resource_firstname?: string | null;
  resource_lastname?: string | null;
  resource_orgname?: string | null;
  resource_role?: string | null;
  resource_country?: string | null;
  resource_region?: string | null;
  resource_city?: string | null;
  resource_startdate?: Date | null;
  resource_enddate?: Date | null;
  resource_designation?: string | null;
  resource_total_experience?: number | null;
  resource_total_experience_organization?: number | null;
  resource_status?: "Active" | "Inactive";
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string | null;
  modified_by?: string | null;
  comments?: string;
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
  public resource_type!: "Full-Time" | "Sub Con" | "Non-Labor";
  public resource_fullname?: string | null;
  public resource_firstname?: string | null;
  public resource_lastname?: string | null;
  public resource_orgname?: string;
  public resource_role?: string | null;
  public resource_country?: string | null;
  public resource_region?: string | null;
  public city?: string | null;
  public resource_startdate?: Date;
  public resource_enddate?: Date;
  public resource_designation?: string | null;
  public resource_total_experience?: number;
  public resource_total_experience_organization?: number;
  public resource_status?: "Active" | "Inactive";
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;
  public account_rid!: string;
  public comments?: string;

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
          type: DataTypes.ENUM("Full-Time", "Sub Con", "Non-Labor"),
          allowNull: false,
        },
        resource_fullname: {
          type: DataTypes.STRING(200),
          validate: {
            len: [3, 200],
          },
          allowNull: true,
        },
        resource_firstname: {
          type: DataTypes.STRING(64),
          validate: {
            len: [3, 64],
          },
          allowNull: true,
        },
        resource_lastname: {
          type: DataTypes.STRING(64),
          validate: {
            len: [3, 64],
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
        resource_country: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        resource_region: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        resource_city: {
          type: DataTypes.UUID,
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
        resource_designation: {
          type: DataTypes.STRING(100),
          validate: {
            len: [4, 100],
          },
          allowNull: true,
        },
        resource_total_experience: {
          type: DataTypes.DECIMAL(4,2),
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        resource_total_experience_organization: {
          type: DataTypes.DECIMAL(4,2),
          allowNull: true,
          validate: {
            min: 0,
          },
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
          allowNull: true,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        comments: {
          type: DataTypes.STRING(1000),
          allowNull: true,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "resources",
        timestamps: false,
        underscored: true,
        validate: {
          bothDatesOrNeither() {
            const hasEffectiveDate = this.resource_startdate !== null && this.resource_startdate !== undefined;
            const hasEndDate = this.resource_enddate !== null && this.resource_enddate !== undefined;
            
            if (hasEffectiveDate !== hasEndDate) {
              throw new Error("Both resource start date and end date must be provided together, or neither should be provided");
            }
          }
        },
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("created_datetime", new Date());
            resources.setDataValue("modified_datetime", new Date());
          },
          beforeValidate: async (account) => {            
            const accountCode = `${R_NUMBER_PREFIX.RESOURCE} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
