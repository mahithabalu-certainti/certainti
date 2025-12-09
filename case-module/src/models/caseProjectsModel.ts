import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface CaseProjectAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  case_rid: string;
  account_rid: string;
  project_rid?: string;
  project_fiscal_rid?: string;
  project_group?: string;
  project_code : string
  fiscal_year : number
  max_ai_interaction : number
}

export interface CaseProjectCreationAttributes
  extends Optional<CaseProjectAttributes, "rid"> {}

export class CaseProject
  extends Model<CaseProjectAttributes, CaseProjectCreationAttributes>
  implements CaseProjectAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public case_rid!: string;
  public account_rid!: string;
  public project_rid?: string;
  public project_fiscal_rid?: string;
  public project_group?: string;
  public project_code! : string
  public fiscal_year! : number
  public max_ai_interaction! : number

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return CaseProject.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        case_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: {
              tableName: "cases",
              schema: schemaName
            },
            key: "rid"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE"
        },
        account_rid: { type: DataTypes.STRING(50), allowNull: false },
        project_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_group: { type: DataTypes.TEXT, allowNull: true },
        project_code : {type : DataTypes.STRING, allowNull : true},
        fiscal_year : {type : DataTypes.BIGINT, allowNull : true},
        max_ai_interaction : {type : DataTypes.INTEGER, allowNull : true}
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "case_projects",
        timestamps: false,
        underscored: true,
      }
    );
  }
}

export async function setupCaseProjectSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_projects_seq START 1`
    );

    await sequelize.query(`
      ALTER TABLE "${schemaName}".case_projects
      ALTER COLUMN r_number SET DEFAULT 'CSP-' || LPAD(nextval('"${schemaName}".case_projects_seq')::text, 10, '0')
    `);

   logMessage("CaseProjects sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up CaseProjects sequence: ${error}`);
  }
}
