import { DataTypes, DATE, Model, Optional, Sequelize, STRING } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";
import { allow } from "joi";

interface CaseTaskAttributes {
    rid : string,
    r_number? : string,
    eid : string,
    created_by : string,
    modified_by? : string,
    created_datetime : Date,
    modified_datetime? : Date,
    task_name : string,
    sequence_no : number,
    effort_in_days : number,
    reminder_interval : number,
    effective_start_datetime? : Date,
    effective_end_datetime? : Date,
    case_team_member_role_rid? : string,
    checklist_template_rid? : string,
    status_rid : string,
    priority_rid? : string,
    milestone_template_rid : string,
    account_rid : string,
    case_rid : string,
    task_type_rid : string,
    task_description? : string,
    task_status_rid : string,
    assigned_to? : string
}

export interface CaseTaskCreationAttributesModel 
extends Optional<CaseTaskAttributes, "eid"> {}

export class CaseTask 
extends Model<CaseTaskAttributes, CaseTaskCreationAttributesModel>
implements CaseTaskAttributes {
    public rid! : string;
    public r_number? : string;
    public eid! : string
    public created_by! : string
    public modified_by? : string
    public created_datetime! : Date
    public modified_datetime? : Date
    public task_name! : string
    public sequence_no! : number
    public effort_in_days! : number
    public reminder_interval! : number
    public effective_start_datetime? : Date
    public effective_end_datetime? : Date
    public case_team_member_role_rid? : string
    public checklist_template_rid? : string
    public status_rid! : string
    public priority_rid? : string
    public milestone_template_rid! : string
    public account_rid! : string
    public case_rid! : string
    public task_type_rid! : string
    public task_description? : string
    public task_status_rid! : string
    public assigned_to? : string

    static initialise(sequelize : Sequelize, schemaName : string) {
        return CaseTask.init({
            rid : {
                type : DataTypes.STRING,
                allowNull : true
            },
            r_number : {
                type : DataTypes. STRING(50),
                allowNull : true,
                unique: true,
            },
            eid : {
                type : DataTypes.STRING(50),
                allowNull : true,
                defaultValue: Sequelize.literal(
                `'${ENV_PREFIX}' || gen_random_uuid()`),
                primaryKey : true
            },
            created_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            modified_by : {
                type : DataTypes.STRING(50),
                allowNull: true
            },
            created_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            modified_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            task_name : {
                type : DataTypes.STRING(64),
                allowNull : true
            },
            sequence_no : {
                type : DataTypes.INTEGER,
                allowNull : true
            },
            effort_in_days : {
                type : DataTypes.INTEGER,
                allowNull : true
            },
            reminder_interval : {
                type : DataTypes.INTEGER,
                allowNull : true
            },
            effective_start_datetime : {
                type : DataTypes.DATEONLY,
                allowNull : true
            },
            effective_end_datetime : {
                type : DataTypes.DATEONLY,
                allowNull : true
            },
            case_team_member_role_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            status_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            priority_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            milestone_template_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            checklist_template_rid : {
                type : DataTypes.STRING(50),
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
            task_type_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            task_description : {
                type : DataTypes.STRING(2000),
                allowNull : true
            },
            task_status_rid : {
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
            tableName : "case_task",
            timestamps : false,
            underscored : true
        })
    }
} 
export async function setupCaseTaskSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_task_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".case_task
      ALTER COLUMN r_number SET DEFAULT 'CSTK-' || LPAD(nextval('"${schemaName}".case_task_seq')::text, 10, '0')`);

    logMessage("Cases sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Cases sequence: ${error}`);
  }
}
