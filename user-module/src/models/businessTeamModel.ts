import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX } from "../utils/constant";
interface BusinessTeamsAttributes {
  rid: string;
  business_team_id: string;
  business_teams: string;
  role_hierarchy?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  public created_by?: string;
  public modified_by?: string;

  // Timestamps
  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    BusinessTeams.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
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
          allowNull: true,
          defaultValue: null,
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
        }
      },
      {
        sequelize,
        modelName: "BusinessTeams",
        tableName: "business_teams",
        timestamps: false,
      }
    );
  }
}
