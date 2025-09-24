import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

interface InteractionTemplateAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  template_name: string;
  interaction_type_rid: string;
  interaction_level_rid?: string;
  status_rid: string;
}

export interface InteractionTemplateCreationAttributes
  extends Optional<InteractionTemplateAttributes, "rid"> {}

export class InteractionTemplate
  extends Model<InteractionTemplateAttributes, InteractionTemplateCreationAttributes>
  implements InteractionTemplateAttributes
{
  public rid!: string;
  public r_number?: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public template_name!: string;
  public interaction_type_rid!: string;
  public interaction_level_rid?: string;
  public status_rid!: string;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    const finalSchemaName = MAIN_SCHEMA_NAME;
    
    return InteractionTemplate.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'${ENV_PREFIX}' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
          defaultValue: Sequelize.literal(
            `'ITP-' || lpad((nextval('${finalSchemaName}.interaction_template_seq'::regclass))::text, 10, '0'::text)`
          ),
        },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false, 
          defaultValue: DataTypes.NOW 
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        template_name: { type: DataTypes.STRING(50), allowNull: true },
        interaction_type_rid: { type: DataTypes.STRING(50), allowNull: false },
        interaction_level_rid: { type: DataTypes.STRING(50), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: false },
      },
      {
        sequelize,
        schema: finalSchemaName,
        tableName: "interaction_templates",
        timestamps: false,
        underscored: true,
      }
    );
  }
}