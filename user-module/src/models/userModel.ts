import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { BusinessTeams } from "./businessTeamModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { Status } from "./statusModel";
interface UserAttributes {
  rid: string;
  r_number?: string;
  eid?: number;
  azure_id?: string;
  ext_object_id?: string;
  login_id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  street?: string;
  city_rid?: string;
  region_rid?: string;
  zip_code?: string;
  country_rid?: string;
  role_rid?: string;
  profile_rid?: string;
  last_login_datetime?: Date;
  login_attempt_failure_count?: number;
  status_rid?: string;
  phone?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  business_teams?: string;
  is_consultant_firm: boolean;
  org_id?:string;
  profile_url?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "rid"> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: number;
  public azure_id?: string;
  public ext_object_id?: string;
  public login_id?: string;
  public first_name!: string;
  public middle_name?: string;
  public last_name!: string;
  public email!: string;
  public street?: string;
  public city_rid?: string;
  public region_rid?: string;
  public zip_code?: string;
  public country_rid?: string;
  public role_rid?: string;
  public profile_rid?: string;
  public last_login_datetime?: Date;
  public login_attempt_failure_count?: number;
  public status_rid?: string;
  public phone?: string;
  public created_by?: string;
  public modified_by?: string;
  public business_teams?: any;
  public is_consultant_firm!: boolean;
  public org_id?: string;
  public profile_url?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
   //sequelize.query(`CREATE SEQUENCE IF NOT EXISTS usr_r_number_seq START 1;`);
    User.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
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
          type: DataTypes.STRING,
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING,
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
        azure_id: {
          type: DataTypes.STRING,
        },
        ext_object_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        login_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        first_name: {
          type: DataTypes.STRING,
        },
        middle_name: {
          type: DataTypes.STRING,
          allowNull: true,
          },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },       
        last_name: {
          type: DataTypes.STRING,
          },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        street: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        city_rid: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        region_rid: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        zip_code: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country_rid: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        profile_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        role_rid: {
          type: DataTypes.STRING(50),
          references: {
            model: {
              tableName : "business_teams",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid",
          },
        },
        profile_rid: {
          type: DataTypes.STRING(50),
          references: {
            model: {
              tableName : "profile",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid",
          },
        },
        last_login_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        login_attempt_failure_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        status_rid: {
          type: DataTypes.STRING,
           references: {
            model: {
              tableName : "status",
              schema : `${MAIN_SCHEMA_NAME}`
            },
            key: "rid",
          },
        },
         is_consultant_firm: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        }, 
         org_id: {
          type: DataTypes.STRING,
          allowNull: true,
        }
      },
      {
        sequelize,
        modelName: "User",
        tableName: "user",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
        hooks: {
          beforeUpdate: (user) => {
            user.setDataValue("modified_datetime", new Date());
          },
        },
      }
    );
    User.belongsTo(Profile, {
      foreignKey: "profile_rid",
      as: "profile",
    });

    User.belongsTo(BusinessTeams, {
      foreignKey: "role_rid",
      as: "business_teams",
    });
     User.belongsTo(Status, {
      foreignKey: "status_rid",
      as: "status",
    });
    
    User.hasMany(Profile, {
      foreignKey: 'created_by',
      as: 'createdProfiles'
    });
    
    User.hasMany(Profile, {
      foreignKey: 'modified_by',
      as: 'modifiedProfiles'
    });

    return User;
  }
}


// export async function setupUserSequence(sequelize: Sequelize) {
//   try {
//     // Step 1: Create the sequence if it doesn't exist
//     await sequelize.query('CREATE SEQUENCE IF NOT EXISTS user_seq START 1');
    
//     // Step 2: Set the default value for r_number to use the sequence
//     await sequelize.query(`ALTER TABLE ${MAIN_SCHEMA_NAME}."user"
//       ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.USER}-' || LPAD(nextval('${MAIN_SCHEMA_NAME}.user_seq')::text, 10, '0')`);
    
//     console.log('User sequence setup complete');
//   } catch (error) {
//     console.error('Error setting up User sequence:', error);
//     // Don't throw the error to allow the application to continue starting up
//     // The sequence setup can be handled separately if needed
//   }
// }