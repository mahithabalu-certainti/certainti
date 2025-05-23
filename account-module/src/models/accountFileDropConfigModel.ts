import { DataTypes, Model, Optional, Sequelize } from "sequelize";
interface AccountFileDropConfigAttributes {
  rid: string;
  account_id: string;
  drop_medium: string;
  cron_expression: string;
  url: string;
  port: number;
  base_folder_path: string;
  credential_key_id: string;
  status: string;
  created_datetime?: Date;
  created_by?: string;
}

interface AccountFileDropConfigCreationAttributes
  extends Optional<AccountFileDropConfigAttributes, "rid"> {}

export class AccountFileDropConfig
  extends Model<AccountFileDropConfigAttributes, AccountFileDropConfigCreationAttributes>
  implements AccountFileDropConfigAttributes
{
  public rid!: string;
  public account_id!: string;
  public drop_medium!: string;
  public cron_expression!: string;
  public url!: string;
  public port!: number;
  public base_folder_path!: string;
  public credential_key_id!: string;
  public status!: string;
  public created_datetime?: Date;
  public created_by?: string;

  static initialize(sequelize: Sequelize) {
    AccountFileDropConfig.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        account_id: {
            type: DataTypes.UUID,
            allowNull: false,
          },
        drop_medium: {
          type: DataTypes.ENUM('SFTP', 'FTP', 'AZURE_BLOB', 'AWS_S3'),
          allowNull: false,
        },
        cron_expression: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        port: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        base_folder_path: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        credential_key_id: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
          allowNull: false,
          defaultValue: 'ACTIVE',
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_by: {
          type: DataTypes.STRING(64),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "AccountFileDropConfig",
        tableName: "account_file_drop_config",
        timestamps: false,
      }
    );

  }
}