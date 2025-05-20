import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";
import { Project } from "./project";

interface ProjectHistoryAttributes {
  rid?: string;
  project_rid: string;
  r_number?: string;
  attribute_name: string;
  old_value?: string;
  new_value: string;
  modified_by: string;
  modified_datetime?: Date;
  created_datetime?: Date;
}

interface ProjectHistoryCreationAttributes
  extends Optional<ProjectHistoryAttributes, "rid"> {}

export class ProjectHistory
  extends Model<ProjectHistoryAttributes, ProjectHistoryCreationAttributes>
  implements ProjectHistoryAttributes
{
  public rid?: string;
  public project_rid!: string;
  public r_number?: string;
  public attribute_name!: string;
  public old_value?: string;
  public new_value!: string;
  public modified_datetime?: Date;
  public modified_by!: string;
  public created_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ProjectHistory.init(
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
        project_rid: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        attribute_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        old_value: {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        new_value: {
          type: DataTypes.STRING(2000),
          allowNull: false,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_datetime: {
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
        tableName: "project_history",
        timestamps: false,
        underscored: true,
        hooks: {
          beforeUpdate: (project) => {
            project.setDataValue("modified_datetime", new Date());
            project.setDataValue("created_datetime", new Date());
          },
          beforeValidate: async (project) => { 
            // Get the latest project history number and increment it
            const latestAccount = await ProjectHistory.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }           
            const accountCode = `${R_NUMBER_PREFIX.PROJECT_HISTORY} ${nextNumber}`;
            project.setDataValue("r_number", accountCode);
          },
        },
      }
    );
    

    ProjectHistory.belongsTo(Project, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project',
    });

    Project.hasMany(ProjectHistory, {
      foreignKey: 'project_rid',
      sourceKey: 'rid',
      as: 'ProjectHistory',
    });

    return ProjectHistory;
  }
}
