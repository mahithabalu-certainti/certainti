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
            // Get the latest project timeline number and increment it
            const latestAccount = await ProjectTimeline.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }            
            const accountCode = `${R_NUMBER_PREFIX.PROJECT_TIMELINE} ${nextNumber}`;
            account.setDataValue("r_number", accountCode);
          },
        },
      }
    );
  }
}
