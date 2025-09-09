import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import AccountDetails from "./accountDetails";

export interface ResourcesAttributes {
  rid?: string;
  eid?: string;
  r_number?: string;
  resource_code: string;
  resource_type_rid: string;
  account_rid: string;
  resource_name?: string | null;
  resource_firstname?: string | null;
  resource_lastname?: string | null;
  resource_orgname?: string | null;
  resource_role?: string | null;
  country_rid?: string | null;
  region_rid?: string | null;
  city_rid?: string | null;
  resource_startdate?: Date | null;
  resource_enddate?: Date | null;
  resource_designation?: string | null;
  resource_total_experience?: number | null;
  resource_total_experience_organization?: number | null;
  status_rid?: string | null;
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
  public resource_code!: string;
  public resource_type_rid!: string;
  public resource_name?: string | null;
  public resource_firstname?: string | null;
  public resource_lastname?: string | null;
  public resource_orgname?: string;
  public resource_role?: string | null;
  public country_rid?: string | null;
  public region_rid?: string | null;
  public city_rid?: string | null;
  public resource_startdate?: Date;
  public resource_enddate?: Date;
  public resource_designation?: string | null;
  public resource_total_experience?: number;
  public resource_total_experience_organization?: number;
  public status_rid?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;
  public account_rid!: string;
  public comments?: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    Resources.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
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
          allowNull: true,
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
          allowNull: true
        },
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        resource_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        resource_type_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        resource_name: {
          type: DataTypes.STRING(200),
          validate: {
            len: [2, 64],
          },
          allowNull: true,
        },
        resource_firstname: {
          type: DataTypes.STRING(100),
          validate: {
            len: [2, 64],
          },
          allowNull: true,
        },
        resource_lastname: {
          type: DataTypes.STRING(100),
          validate: {
            len: [2, 64],
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
            len: [3, 100],
          },
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        region_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        city_rid: {
          type: DataTypes.STRING(50),
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
            len: [3, 100],
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
        status_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        comments: {
          type: DataTypes.TEXT,
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
        },        
      }      
    );
    
    return Resources;
  }
}

export async function setupResourceSeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resources_seq START 1;
    `);

    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`
      ALTER TABLE "${schemaName}".resources
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE}-' || LPAD(nextval('"${schemaName}".resources_seq')::text, 10, '0');
    `);

    console.log('Resource sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource sequence:', error);
    // Optionally: log more detail or report somewhere
  }
}
