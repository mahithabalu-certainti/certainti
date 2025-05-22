import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
import { R_NUMBER_PREFIX } from "../utils/constant";
interface RegionAttributes {
  rid: string;
  r_number?: string;
  country_rid: string;
  country_name: string;
  region_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface RegionCreationAttributes extends Optional<RegionAttributes, "rid"> {}

export class Region
  extends Model<RegionAttributes, RegionCreationAttributes>
  implements RegionAttributes
{
  rid!: string;
  r_number?: string;
  country_rid!: string;
  country_name!: string;
  region_name!: string;
  created_datetime!: Date;
  modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    Region.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        region_name: {
          type: DataTypes.STRING,
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
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Region",
        tableName: "regions",
        timestamps: false,
      }
    );

    Region.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });
    return Region;
  }
}

export async function setupRegionSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS region_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE regions
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.REGION} ' || LPAD(nextval('region_seq')::text, 10, '0')`);
    
    console.log('Region sequence setup complete');
  } catch (error) {
    console.error('Error setting up Region sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
