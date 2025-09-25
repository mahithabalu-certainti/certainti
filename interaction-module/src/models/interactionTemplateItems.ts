import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface InteractionTemplateItemAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  template_rid?: string;
  interaction_level_rid: string;
  question_seq_num?: string;
  is_mandatory: boolean;
  question: string;
  notes?: string;
}

export interface InteractionTemplateItemCreationAttributes
  extends Optional<InteractionTemplateItemAttributes, "rid"> {}

export class InteractionTemplateItem
  extends Model<InteractionTemplateItemAttributes, InteractionTemplateItemCreationAttributes>
  implements InteractionTemplateItemAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public template_rid?: string;
  public interaction_level_rid!: string;
  public question_seq_num?: string;
  public is_mandatory!: boolean;
  public question!: string;
  public notes?: string;


  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
     const finalSchemaName = MAIN_SCHEMA_NAME;
    return InteractionTemplateItem.init(
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

        template_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_level_rid: { type: DataTypes.STRING(20), allowNull: true },
        question_seq_num: { type: DataTypes.STRING(50), allowNull: true },
        is_mandatory: { type: DataTypes.BOOLEAN, allowNull: true },
        question: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
         schema: finalSchemaName,
        tableName: "interaction_template_items",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
