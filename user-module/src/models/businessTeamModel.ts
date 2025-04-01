import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";

interface BusinessTeamsAttributes {
  rid: string; 
  business_team_id: string;
  business_teams: string;
  role_hierarchy?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface BusinessTeamsCreationAttributes
  extends Optional<BusinessTeamsAttributes, "rid"> {}

export class BusinessTeams
  extends Model<BusinessTeamsAttributes, BusinessTeamsCreationAttributes>
  implements BusinessTeamsAttributes
{
  public rid!: string; 
  public business_team_id!: string;
  public business_teams!: string;
  public role_hierarchy?: string | null;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
}

// Initialize the model
BusinessTeams.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    business_team_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    business_teams: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role_hierarchy: {
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
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "BusinessTeams",
    tableName: "business_teams",
    timestamps: false,
  }
);
