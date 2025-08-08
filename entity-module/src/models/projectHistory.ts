import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { Project } from "./project";
import { ProjectFiscal } from "./projectFiscal";

interface ProjectHistoryAttributes {
  rid?: string;
  project_rid: string;
  r_number?: string;
  attribute_name: string;
  old_value?: string;
  new_value: string;
  modified_by?: string;
  modified_datetime?: Date;
  created_datetime?: Date;
  created_by: string;
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
  public modified_by?: string;
  public created_datetime?: Date;
  public created_by!: string;

  static initialize(sequelize: Sequelize, schemaName: string) {
    ProjectHistory.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          allowNull: false,
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
         created_by: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        modified_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_datetime: {
          type: DataTypes.DATE,
          allowNull: false
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        
        project_rid: {
          type: DataTypes.STRING(50),
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
        },
      }
    );

    ProjectHistory.belongsTo(ProjectFiscal, {
      foreignKey: 'project_rid',
      targetKey: 'rid',
      as: 'project_history_project_fiscal',
    });

    ProjectFiscal.hasMany(ProjectHistory, {
      foreignKey: 'project_rid',
      sourceKey: 'rid',
      as: 'ProjectHistory',
    });
    return ProjectHistory;
  }
}


export async function setupProjectHistorySeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".project_history_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".project_history
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.PROJECT_HISTORY}-' || LPAD(nextval('"${schemaName}".project_history_seq')::text, 10, '0')`);
    
    console.log('Project history sequence setup complete');
  } catch (error) {
    console.error('Error setting up Project history sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}
