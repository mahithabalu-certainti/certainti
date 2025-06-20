import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX } from "../utils/constant";
interface OrganizationLicensesAttributes {
  rid: string;
  firm_name: string;
  logo_url: string;
  license_type: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface OrganizationLicensesCreationAttributes
  extends Optional<OrganizationLicensesAttributes, "rid"> {}

export class OrganizationLicenses
  extends Model<OrganizationLicensesAttributes, OrganizationLicensesCreationAttributes>
  implements OrganizationLicensesAttributes
{
  public rid!: string;
  public firm_name!: string;
  public logo_url!: string;
  public license_type!: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
  public created_by?: string;
  public modified_by?: string;

  static initialize(sequelize: Sequelize) {
    OrganizationLicenses.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
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
          allowNull: true,
          defaultValue: null,
        },
        firm_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        license_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        logo_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        
      },
      {
        sequelize,
        modelName: "OrganizationLicenses",
        tableName: "organization_licenses",
        timestamps: false,
      }
    );
  }
}
