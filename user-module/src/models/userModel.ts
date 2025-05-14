import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { BusinessTeams } from "./businessTeamModel";
import { R_NUMBER_PREFIX } from "../utils/constant";
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
  full_name?: string;
  email: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  role_rid?: string;
  profile_rid?: string;
  last_login_datetime?: Date;
  login_attempt_failure_count?: number;
  status?: string;
  phone?: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  business_teams?: any;
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
  public full_name?: string;
  public email!: string;
  public street?: string;
  public city?: string;
  public state?: string;
  public zip_code?: string;
  public country?: string;
  public role_rid?: string;
  public profile_rid?: string;
  public last_login_datetime?: Date;
  public login_attempt_failure_count?: number;
  public status?: string;
  public phone?: string;
  public created_by?: string;
  public modified_by?: string;
  public business_teams?: any;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
   sequelize.query(`CREATE SEQUENCE IF NOT EXISTS usr_r_number_seq START 1;`);
    User.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        eid: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
        full_name: {
          type: DataTypes.STRING,
          allowNull: true,
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
        city: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        zip_code: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        country: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        role_rid: {
          type: DataTypes.UUID,
          references: {
            model: "business_teams",
            key: "rid",
          },
        },
        profile_rid: {
          type: DataTypes.UUID,
          references: {
            model: "profile",
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
        status: {
          type: DataTypes.STRING,
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
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "user",
        timestamps: false,
        hooks: {
          beforeUpdate: (user) => {
            user.setDataValue("modified_datetime", new Date());
          },
            beforeValidate: async (user: User) => {
            if (!user.r_number) {
              const [result] = await sequelize.query("SELECT nextval('usr_r_number_seq')");
              const nextNum = (result[0] as { nextval: number }).nextval;
              user.r_number = `${R_NUMBER_PREFIX.USER} ${String(nextNum).padStart(10, '0')}`;
            }
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
    
    User.hasMany(Profile, {
      foreignKey: 'created_by',
      as: 'createdProfiles'
    });
    
    User.hasMany(Profile, {
      foreignKey: 'modified_by',
      as: 'modifiedProfiles'
    });

    
  }
}
