import { DataTypes, Model, Optional, Sequelize, UUID } from "sequelize";
import { DatabaseConnection } from "./dbConnectionModel";
import { Country } from "./countryModel";
import { Currency } from "./currencyModel";
import { Industry } from "./industryModel";
import { R_NUMBER_PREFIX } from "../utils/constant";
import { AccountFileDropConfig } from "./accountFileDropConfigModel";
import { States } from "./stateModel";
interface AccountAttributes {
  rid: string;
  eid?: string;
  r_number?: string;
  account_name: string;
  comments?: string;
  region?: string;
  is_parent: boolean;
  parent_account_rid?: string | null;
  storage_type: string;
  database_connection_rid?: string;
  country_rid?: string;
  currency_rid?: string;
  industry_rid: string;
  industry_name_other?: string;
  status: string;
  annual_revenue: string;
  is_file_drop_enabled?: boolean;
  file_drop_medium?: string;
  file_drop_config_id?: string; 
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
  total_projects?:string;
  total_project_cost?:number;
  total_project_hours?:number;
  qualifying_project_hours_fed?:number;
  qualifying_project_qre_fed?:number;
  qualifying_project_rd_credits_fed?:number;
  total_projects_rd_credits?:number;

}

interface AccountCreationAttributes
  extends Optional<AccountAttributes, "rid"> {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public rid!: string;
  public r_number?: string;
  public account_name!: string;
  public comments?: string;
  public is_parent!: boolean;
  public eid?: string;
  public region?: string;
  public storage_type!: string;
  public parent_account_rid?: string | null;
  public database_connection_rid?: string;
  public country_rid?: string;
  public currency_rid?: string;
  public industry_rid!: string;
  public industry_name_other?: string;
  public status!: string;
  public annual_revenue!: string;
  public is_file_drop_enabled?: boolean;
  public file_drop_medium?: string;
  public file_drop_config_id?: string; 
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public created_by?: string;
  public modified_by?: string;
  public total_projects?:string;
  public total_project_cost?:number;
  public total_project_hours?:number;
  public qualifying_project_hours_fed?:number;
  public qualifying_project_qre_fed?:number;
  public qualifying_project_rd_credits_fed?:number;
  public total_projects_rd_credits?:number;

  static initialize(sequelize: Sequelize) {
    Account.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        account_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        comments: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        eid: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            isIn: [["active", "inactive"]],
          },
        },
        is_parent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        annual_revenue: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        region: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        storage_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        parent_account_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        database_connection_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        currency_rid: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        industry_rid: {
          type: UUID,
          allowNull: false,
        },
        industry_name_other: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        is_file_drop_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        file_drop_medium: {
          type: DataTypes.ENUM('SFTP', 'FTP', 'AZURE_BLOB', 'AWS_S3'),
          allowNull: true,
        },
        file_drop_config_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "account_file_drop_config",
            key: "rid"
          }
        },
        total_projects: DataTypes.DOUBLE,
        total_project_cost: DataTypes.DECIMAL(13, 2),
        total_projects_rd_credits: DataTypes.DECIMAL(13, 2),
        total_project_hours: DataTypes.DECIMAL(13, 2),
        qualifying_project_hours_fed: DataTypes.DECIMAL(13, 2),
        qualifying_project_qre_fed: DataTypes.DECIMAL(13, 2),
        qualifying_project_rd_credits_fed: DataTypes.DECIMAL(13, 2),
  
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
        }
      },
      {
        sequelize,
        modelName: "Account",
        tableName: "account",
        timestamps: false,
        hooks: {
          beforeUpdate: (user) => {
            user.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );
    // Associations
    Account.belongsTo(Account, {
      foreignKey: "parent_account_rid",
      as: "parent_account",
    });

    Account.hasMany(Account, {
      foreignKey: "parent_account_rid",
      as: "child_accounts",
    });

    Account.belongsTo(DatabaseConnection, {
      foreignKey: "database_connection_rid",
      as: "database_connection",
    });

    Account.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });

    Account.belongsTo(Industry, {
      foreignKey: "industry_rid",
      as: "industry",
    });

    Account.belongsTo(Currency, {
      foreignKey: "currency_rid",
      as: "currency",
    });

    Account.belongsTo(States, {
      foreignKey: "region",
      as: "regions",
    });

    Account.belongsTo(AccountFileDropConfig, {
      foreignKey: "file_drop_config_id",
      as: "file_drop_config",
    });
  }
}


export async function setupAccountSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS account_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE account
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.ACCOUNT} ' || LPAD(nextval('account_seq')::text, 10, '0')`);
    
    console.log('Account sequence setup complete');
  } catch (error) {
    console.error('Error setting up Account sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}