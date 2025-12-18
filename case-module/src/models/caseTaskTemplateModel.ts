import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface CaseTaskTemplateAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  task_name: string;
  sequence_no?: number;
  effort_in_days?: number;
  effective_start_datetime?: Date;
  effective_end_datetime?: Date;
  case_team_member_role_rid?: string;
  checklist_template_rid?: string;
  status_rid?: string;
  priority_rid?: string;
  task_type_rid?: string;
  milestone_template_rid?: string;
  task_description? : string
  weightage_rid? : string
  task_category_rid? : string
  milestone_sequence? : number
}

export interface CaseTaskTemplateCreationAttributes
  extends Optional<CaseTaskTemplateAttributes, "rid"> {}

export class TaskTemplate
  extends Model<CaseTaskTemplateAttributes, CaseTaskTemplateCreationAttributes>
  implements CaseTaskTemplateAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public task_name!: string;
  public sequence_no?: number;
  public effort_in_days?: number;
  public effective_start_datetime?: Date;
  public effective_end_datetime?: Date;
  public case_team_member_role_rid?: string;
  public checklist_template_rid?: string;
  public status_rid?: string;
  public priority_rid?: string;
  public task_type_rid?: string;
  public milestone_template_rid?: string;
  public task_description?: string | undefined;
  public weightage_rid?: string;
  public task_category_rid? : string;
  public milestone_sequence! : number

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return TaskTemplate.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: Sequelize.literal(
            `('${ENV_PREFIX}' || gen_random_uuid())`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          defaultValue: Sequelize.literal(
            `('TST-' || lpad((nextval('trd365.task_template_seq'))::text, 10, '0'))`
          ),
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
        task_name: { type: DataTypes.STRING(255), allowNull: false },
        sequence_no: { type: DataTypes.INTEGER, allowNull: true },
        effort_in_days: { type: DataTypes.INTEGER, allowNull: true },
        effective_start_datetime: { type: DataTypes.DATE, allowNull: true },
        effective_end_datetime: { type: DataTypes.DATE, allowNull: true },
        case_team_member_role_rid: { type: DataTypes.STRING(50), allowNull: true },
        checklist_template_rid: { type: DataTypes.STRING(50), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        priority_rid: { type: DataTypes.STRING(50), allowNull: true },
        task_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        milestone_template_rid: { type: DataTypes.STRING(50), allowNull: true },
        task_description : {type : DataTypes.TEXT(), allowNull : true},
        weightage_rid : {type : DataTypes.STRING, allowNull : true},
        task_category_rid : {type : DataTypes.STRING, allowNull : true},
        milestone_sequence : {type : DataTypes.INTEGER, allowNull : true}
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "task_template",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
