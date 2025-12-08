import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

interface CreateCollaboratorsAttributes {
    rid : string
    r_number? : string
    created_by? : string
    modified_by? : string
    created_datetime : Date
    modified_datetime? : Date
    account_rid : string
    case_rid?: string
    task_rid : string
    assigned_to : string
}

export interface CreateCollaborators 
extends Optional<CreateCollaboratorsAttributes, "rid"> {}

export class TaskCollaborators 
extends Model<CreateCollaboratorsAttributes, CreateCollaborators>
implements  CreateCollaboratorsAttributes {
    public rid! : string
    public r_number? : string
    public created_by? : string
    public modified_by? : string
    public created_datetime! : Date
    public modified_datetime? : Date
    public account_rid!: string
    public case_rid?: string
    public task_rid! : string
    public assigned_to! : string 

    static initialise (sequelize : Sequelize, schemaName : string) {
        return TaskCollaborators.init({
            rid : {
                type: DataTypes.STRING(50),
                defaultValue: Sequelize.literal(
                    `'${ENV_PREFIX}' || gen_random_uuid()`
                ),
                primaryKey: true,
            },
            r_number : {
                type: DataTypes.STRING(20),
                allowNull: true,
                unique: true,
            },
            created_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            modified_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            created_datetime : {
                type : DataTypes.DATE,
                allowNull : true,
            },
            modified_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            account_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            case_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            task_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            assigned_to : {
                type : DataTypes.STRING(50),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "task_collaborators",
            timestamps : false,
            underscored : true
        })
    }
}
export async function setupTaskCollaboratorsSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".task_collaborators_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".task_collaborators
      ALTER COLUMN r_number SET DEFAULT 'TCO-' || LPAD(nextval('"${schemaName}".task_collaborators_seq')::text, 10, '0')`);

    logMessage("TaskCollaborators sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up TaskCollaborators sequence: ${error}`);
  }
}