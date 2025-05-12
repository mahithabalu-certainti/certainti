import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ProjectTimelineAttributes {
  rid?: string;
  account_rid: string;
  r_number?: string;
  event_name: string;
  event_status: string;
  event_datetime?: Date;
  event_type: string;
  entity_rid: string;
  modified_by: string;
}

interface ProjectTimelineCreationAttributes
  extends Optional<ProjectTimelineAttributes, "rid"> {}

export class ProjectTimeline
  extends Model<ProjectTimelineAttributes, ProjectTimelineCreationAttributes>
  implements ProjectTimelineAttributes
{
  public rid?: string;
  public account_rid!: string;
  public r_number?: string;
  public event_name!: string;
  public event_status!: string;
  public event_datetime?: Date;
  public event_type!: string;
  public entity_rid!: string;
  public modified_by!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return ProjectTimeline.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
        },
        account_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        entity_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        event_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_status: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        event_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_by: {
          type: DataTypes.UUID,
          allowNull: false,
        },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "project_timeline",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (resources) => {
            resources.setDataValue("event_datetime", new Date());
          },
          beforeValidate: async (account) => {            
            const accountCode = `${R_NUMBER_PREFIX.PROJECT_TIMELINE} ${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
