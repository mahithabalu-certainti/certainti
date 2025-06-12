import { DataTypes, Model, Optional, Sequelize } from "sequelize";
interface OrganizationLicensesAttributes {
  rid: string;
  firm_name: string;
  logo_url: string;
  license_type: string;
  created_datetime?: Date;
  modified_datetime?: Date;
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

  static initialize(sequelize: Sequelize) {
    OrganizationLicenses.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
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
