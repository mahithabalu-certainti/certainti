import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { Status } from "./statusModel";
import { User } from "./userModel";
import { UserGroup } from "./userGroupModel";

// Import User model
// import { User } from "./userModel";

interface UserGroupEntityAccessAttributes {
  rid: string;
  created_by?: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  group_rid?: string | null;
  entity_rid: string;
  user_rid?: string | null;
  comment?: string | null;
  entity_type: 'ACCOUNT' | 'PROJECT';
  access_type: 'INCLUDE' | 'EXCLUDE';
  
}

// Define the interface for the creation attributes (optional fields like created_datetime, modified_datetime)
interface UserGroupEntityAccessCreationAttributes
  extends Optional<UserGroupEntityAccessAttributes, "rid"> {}

// Define the Profile model class extending Sequelize's Model class
export class UserGroupEntityAccess
  extends Model<UserGroupEntityAccessAttributes, UserGroupEntityAccessCreationAttributes>
  implements UserGroupEntityAccessAttributes
{
  public rid!: string;
  public group_rid?: string;
  public comment?:string;
  public user_rid?: string;
  public created_by?: string;
  public modified_by?: string;
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
  public entity_type!: 'ACCOUNT' | 'PROJECT';
  public entity_rid!: string;
  public access_type!: 'INCLUDE' | 'EXCLUDE';


  static initialize(sequelize: Sequelize) {
    // Initialize the model
    UserGroupEntityAccess.init(
      {
        rid: {
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
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
        group_rid: {
          type: DataTypes.STRING,
           allowNull: true,
        },
        entity_rid: {
          type: DataTypes.STRING,
          allowNull: false,
        },
         user_rid: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        entity_type: {
          type: DataTypes.ENUM('ACCOUNT', 'PROJECT'),
          allowNull: false,
        },
        access_type: {
          type: DataTypes.ENUM('INCLUDE', 'EXCLUDE'),
          allowNull: false,
        },
          comment: {
          type: DataTypes.STRING,
          allowNull: true,
        },


        
        
      },
      {
        sequelize,
        modelName: "UserGroupEntityAccess",
        tableName: "user_group_entity_access",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );
      // Set up the sequence and default value for r_number
      // setupProfileSequence(sequelize);
  }
  static associate(models: any) {
      UserGroupEntityAccess.belongsTo(UserGroup, {
        foreignKey: "group_rid",
        as: "group"
      });
    UserGroupEntityAccess.belongsTo(User, {
  foreignKey: "user_rid",
  as: "user"
});

    return UserGroupEntityAccess;
  }
}

