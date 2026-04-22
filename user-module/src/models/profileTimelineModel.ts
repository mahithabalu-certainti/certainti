import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { Profile } from "./profileModel";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constant";

interface ProfileTimelineAttributes {
  rid: string;
  profile_rid: string;
  event_name: string;
  event_status: string;
  event_datetime: Date;
  modified_by?: string;
  modified_datetime?: Date;
  created_by?: string;
  created_datetime?: Date;
}

interface ProfileTimelineCreationAttributes extends Optional<ProfileTimelineAttributes, "rid"> {}

export class ProfileTimeline
  extends Model<ProfileTimelineAttributes, ProfileTimelineCreationAttributes>
  implements ProfileTimelineAttributes
{
  public rid!: string;
  public profile_rid!: string;
  public event_name!: string;
  public event_status!: string;
  public event_datetime!: Date;
  public modified_by?: string;
  public modified_datetime?: Date;
  public created_by?: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ProfileTimeline.init(
      {
        rid: { 
          type: DataTypes.STRING(50), 
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true 
        },
        created_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW  
        },
        modified_by: { 
          type: DataTypes.STRING,
          allowNull: true 
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false
        },
        profile_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: {
            tableName : "profile",
            schema : `${MAIN_SCHEMA_NAME}`
          }, key: "rid" },
        },
        event_name: { 
          type: DataTypes.STRING, 
          allowNull: false 
        },
        event_status: { 
          type: DataTypes.STRING, 
          allowNull: false 
        },
        event_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false,
          defaultValue: DataTypes.NOW 
        },
      },
      {
        sequelize,
        modelName: "ProfileTimeline",
        tableName: "profile_timeline",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`,
      }
    );

    // Define association with Profile model
    ProfileTimeline.belongsTo(Profile, { foreignKey: "profile_rid", as: "profile" });
  }
}