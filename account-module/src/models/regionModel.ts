import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { errorLog } from "../utils/helpers";
interface RegionAttributes {
  rid: string;
  r_number?: string;
  country_rid: string;
  country_name: string;
  region_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    Region.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
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
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: {
              tableName : "country",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid"
          },
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        region_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
       
      },
      {
        sequelize,
        modelName: "Region",
        tableName: "regions",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
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
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS ${MAIN_SCHEMA_NAME}.region_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE ${MAIN_SCHEMA_NAME}.regions
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.REGION}-' || LPAD(nextval('s${MAIN_SCHEMA_NAME}.region_seq')::text, 10, '0')`);

  } catch (error) {
    errorLog("Error setting up Region sequence:", (error as Error).message);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
