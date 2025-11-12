
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface EmailTemplateAttributes {
  rid: string;
  r_number?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  template_name: string;
  description?: string;
  category_rid?: string;
  subject: string;
  body_html?: string;
  status_rid?: string;
}

export interface EmailTemplateCreationAttributes extends Optional<EmailTemplateAttributes, "rid"> {}

export class EmailTemplate extends Model<EmailTemplateAttributes, EmailTemplateCreationAttributes> implements EmailTemplateAttributes {
  public rid!: string;
  public r_number?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public template_name!: string;
  public description?: string;
  public category_rid?: string;
  public subject!: string;
  public body_html?: string;
  public status_rid?: string;

  static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
    return EmailTemplate.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
        },
        r_number: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true,
        },
        created_by: { type: DataTypes.STRING(50), allowNull: false },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        template_name: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.STRING(2000), allowNull: true },
        category_rid: { type: DataTypes.STRING(50), allowNull: true },
        subject: { type: DataTypes.STRING(255), allowNull: false },
        body_html: { type: DataTypes.TEXT, allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
      },
      {
        sequelize,
        schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
        tableName: "email_template",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
