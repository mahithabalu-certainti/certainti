import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constant";

// Import User model
// import { User } from "./userModel";

interface ProfileAttributes {
  rid: string; // UUID
  r_number?: string;
  eid?: number;
  profile_name: string;
  profile_type: string;
  profile_description?: string;
  profile_status?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  creator?: any;  // Association property for User who created the profile
  modifier?: any; // Association property for User who modified the profile
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface ProfileCreationAttributes
  extends Optional<ProfileAttributes, "rid"| "r_number"> {}

// Define the Profile model class extending Sequelize's Model class
export class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: number;
  public profile_name!: string;
  public profile_type!: string;
  public profile_description?: string;
  public profile_status?: string;
  public created_by?: string;
  public modified_by?: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  // Add associations
  public readonly creator?: any;
  public readonly modifier?: any;

  static initialize(sequelize: Sequelize) {
    // Initialize the model
    Profile.init(
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
          unique: true,
        },
        eid: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        profile_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        profile_type: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        profile_description: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        profile_status: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'user',
            key: 'rid'
          }
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'user',
            key: 'rid'
          }
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
        modelName: "Profile",
        tableName: "profile",
        timestamps: false,
      }
    );
      // Set up the sequence and default value for r_number
      // setupProfileSequence(sequelize);
  }
  static associate(models: any) {
    // Set up associations after all models are initialized
    Profile.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    Profile.belongsTo(models.User, {
      foreignKey: 'modified_by',
      as: 'modifier'
    });

    return Profile;
  }
}

export async function setupProfileSequence(sequelize: Sequelize) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query('CREATE SEQUENCE IF NOT EXISTS profile_seq START 1');
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE profile
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROFILE} ' || LPAD(nextval('profile_seq')::text, 10, '0')`);
    
    console.log('Profile sequence setup complete');
  } catch (error) {
    console.error('Error setting up profile sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}