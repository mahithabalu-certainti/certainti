import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constant";
interface StateAttributes {
  rid: string;
  country_rid: string;
  state_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
}

interface StateCreationAttributes extends Optional<StateAttributes, "rid"> {}

export class States
  extends Model<StateAttributes, StateCreationAttributes>
  implements StateAttributes
{
  rid!: string;
  country_rid!: string;
  state_name!: string;
  created_datetime!: Date;
  modified_datetime!: Date;
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    States.init(
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
        },
        state_name: {
          type: DataTypes.STRING,
          allowNull: false,
        }
      },
      {
        sequelize,
        modelName: "State",
        tableName: "state",
        timestamps: false,
      }
    );

    States.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });
    return States;
  }
}

export async function setupStateSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS state_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE state
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.STATE}-' || LPAD(nextval('state_seq')::text, 10, '0')`);
    
    console.log('State sequence setup complete');
  } catch (error) {
    console.error('Error setting up State sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
