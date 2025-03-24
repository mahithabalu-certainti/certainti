import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import { Profile } from "./profileModel";
import { BusinessTeams } from "./businessTeamModel";
import { UserDetails } from "./userDetailsModel";

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
  city?: number;
  state?: number;
  zip_code?: string;
  country?: number;
  role_rid?: string;
  profile_rid?: string;
  last_login_datetime?: Date;
  login_attempt_failure_count?: number;
  status?: string;
  created_by?: string;
  modified_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  public city?: number;
  public state?: number;
  public zip_code?: string;
  public country?: number;
  public role_rid?: string;
  public profile_rid?: string;
  public last_login_datetime?: Date;
  public login_attempt_failure_count?: number;
  public status?: string;
  public created_by?: string;
  public modified_by?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

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
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    modelName: "User",
    tableName: "user",
    timestamps: true,
    hooks: {
      beforeUpdate: (user) => {
        user.setDataValue("updatedAt", new Date());
        user.setDataValue("createdAt", new Date());
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

/* 
common columns
1. first_name
2. middle_name
3. last_name
4. email
5. mobile
6. profile_id
7. status 
8. role
9. street
10. city
11. state
12. zip_code
13. country
14. created_by
15. modified_by
16. azure_id


enterprise assist columns 
1. designation
2. manager_name
3. manager_email
4. manager_employee_id
5. employee_id
6. employment_date
7. department_id
8. function_group_id

*/
