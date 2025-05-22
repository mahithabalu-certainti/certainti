import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

interface ResourceSkillHistoryAttributes  {
 rid: string,
 r_number?: string,
 resource_skill_rid: string,
 attribute_name: string,
 old_value?: string,
 new_value: string
 modified_datetime?: Date,
 modified_by: string,
}

interface ResourceSkillHistoryCreationAttributes
  extends Optional<ResourceSkillHistoryAttributes, "rid"> {}

export class ResourceSkillHistory extends Model<ResourceSkillHistoryAttributes, ResourceSkillHistoryCreationAttributes> implements ResourceSkillHistoryAttributes 
{
    rid!: string;
    r_number?: string;
    resource_skill_rid!: string;
    attribute_name!: string;
    old_value?: string;
    new_value!: string;
    modified_datetime?: Date;
    modified_by!: string;

  static initialize(sequelize: Sequelize,schemaName:string) {
    ResourceSkillHistory.init(
      {
       rid: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
       },
       r_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
       },
       resource_skill_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       attribute_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       old_value: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       new_value: {
         type: DataTypes.STRING(255),
         allowNull: false,
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_by: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkillHistory",
        tableName: "resource_skill_history",
        timestamps: false,
      }
    );
    return ResourceSkillHistory;
  }
}


export async function setupResourceSkillHistorySeq(sequelize: Sequelize, schemaName: string) {
  try {
    // Step 1: Create the sequence if it doesn't exist
    await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "${schemaName}".resource_skill_history_seq START 1`);
    
    // Step 2: Set the default value for r_number to use the sequence
    await sequelize.query(`ALTER TABLE "${schemaName}".resource_skill_history
      ALTER COLUMN r_number SET DEFAULT '${R_NUMBER_PREFIX.RESOURCE_SKILL_HISTORY} ' || LPAD(nextval('"${schemaName}".resource_skill_history_seq')::text, 10, '0')`);
    
    console.log('Resource skill history sequence setup complete');
  } catch (error) {
    console.error('Error setting up Resource skill history sequence:', error);
    // Don't throw the error to allow the application to continue starting up
    // The sequence setup can be handled separately if needed
  }
}