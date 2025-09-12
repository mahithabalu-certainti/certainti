import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface InteractionItemAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  project_rid: string;
  fiscal_year: number;
  project_fiscal_rid: string;
  interaction_rid?: string;
  account_interaction_rid?: string;
  type?: string;
  question_seq_num?: string;
  is_mandatory: boolean;
  question: string;
  notes?: string;
  response?: string;
  is_attachment?: boolean;
  is_editable?: boolean;
}

export interface InteractionItemCreationAttributes
  extends Optional<InteractionItemAttributes, "rid"> {}

export class InteractionItem
  extends Model<InteractionItemAttributes, InteractionItemCreationAttributes>
  implements InteractionItemAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public project_rid!: string;
  public fiscal_year!: number;
  public project_fiscal_rid!: string;
  public interaction_rid?: string;
  public account_interaction_rid?: string;
  public type?: string;
  public question_seq_num?: string;
  public is_mandatory!: boolean;
  public question!: string;
  public notes?: string;
  public response?: string;
 
  public is_attachment?: boolean;
  public is_editable?: boolean;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    return InteractionItem.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: { type: DataTypes.STRING(120), allowNull: true },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: true },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: true },
        project_rid: { type: DataTypes.STRING(50), allowNull: true },
        fiscal_year: { type: DataTypes.INTEGER, allowNull: true },
        project_fiscal_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        account_interaction_rid: { type: DataTypes.STRING(50), allowNull: true },
        type: { type: DataTypes.STRING(20), allowNull: true },
        question_seq_num: { type: DataTypes.STRING(50), allowNull: true },
        is_mandatory: { type: DataTypes.BOOLEAN, allowNull: true },
        question: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
      
        is_attachment: { type: DataTypes.BOOLEAN, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "interaction_items",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
