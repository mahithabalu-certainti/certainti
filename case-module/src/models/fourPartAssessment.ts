import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX } from "../utils/constants"
import { logMessage } from "../utils/helpers"

export interface FourPartAssessmentAttributes {
  rid : string
  r_number? : string
  created_by : string
  created_datetime : Date
  modified_by? : string
  modified_datetime? : Date
  account_rid : string
  project_rid? : string
  project_fiscal_rid : string
  tracker_one_liner? : string
  project_metadata? : string
  permitted_purpose? : string
  technological_uncertainty? : string
  process_of_experimentation? : string
  technological_in_nature? : string
  status? : string
  rationale? : string
  summary_judgment? : string
  rd_potential_category? : string
  transaction_id? : string
}

export interface FourPartAssessmentCreationAttributes extends Optional<FourPartAssessmentAttributes, "rid"> {}

export class FourPartAssessment extends Model<FourPartAssessmentAttributes, FourPartAssessmentCreationAttributes> {
  declare rid : string
  declare r_number? : string
  declare created_by : string
  declare created_datetime : Date
  declare modified_by? : string
  declare modified_datetime? : Date
  declare account_rid : string
  declare project_rid? : string
  declare project_fiscal_rid : string
  declare tracker_one_liner? : string
  declare project_metadata? : string
  declare permitted_purpose? : string
  declare technological_uncertainty? : string
  declare process_of_experimentation? : string
  declare technological_in_nature? : string
  declare status? : string
  declare rationale? : string
  declare summary_judgment? : string
  declare rd_potential_category? : string
  declare transaction_id? : string

  static initialise (sequelize : Sequelize, schemaName : string) {
    return FourPartAssessment.init({
      rid : {
        type : DataTypes.STRING,
        defaultValue : Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
        primaryKey : true
      },
      r_number : {
        type : DataTypes.STRING,
        allowNull : true
      },
      created_by: { type: DataTypes.STRING(50), allowNull: true },
      modified_by: { type: DataTypes.STRING(50), allowNull: true },
      created_datetime: { 
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: DataTypes.NOW
      },
      modified_datetime: { type: DataTypes.DATE, allowNull: true },
      project_rid : { type: DataTypes.STRING(50), allowNull: true },
      project_fiscal_rid : { type: DataTypes.STRING(50), allowNull: true },
      account_rid: { type: DataTypes.STRING(50), allowNull: true},
      tracker_one_liner : { type : DataTypes.STRING(), allowNull : true },
      project_metadata : { type : DataTypes.STRING(), allowNull : true },
      permitted_purpose : { type : DataTypes.STRING(), allowNull : true },
      technological_uncertainty : { type : DataTypes.STRING(), allowNull : true },
      technological_in_nature : { type : DataTypes.STRING(), allowNull : true },
      process_of_experimentation : { type : DataTypes.STRING(), allowNull : true },
      rationale : { type : DataTypes.STRING(), allowNull : true },
      status : { type : DataTypes.STRING(), allowNull : true },
      summary_judgment : { type : DataTypes.STRING(), allowNull : true },
      rd_potential_category : { type : DataTypes.STRING(), allowNull : true },
      transaction_id : { type : DataTypes.STRING(50), allowNull : true }
    }, {
      sequelize : sequelize,
      schema : schemaName,
      tableName : "four_part_assessment",
      freezeTableName : true,
      timestamps : false,
      underscored : true
    })
  }
}

export async function createFourPartSequence (sequelize : Sequelize, schemaName : string) {
  try {
    const sequence = `CREATE SEQUENCE IF NOT EXISTS ${schemaName}.four_part_assessment_sequence START 1`;
    await sequelize.query(sequence);
    await sequelize.query(
      `ALTER TABLE ${schemaName}.four_part_assessment ALTER COLUMN r_number 'FPA-' || LPAD(nextVal('"${schemaName}".four_part_assessment_sequence')::text, 10, '0')`
    )
    logMessage("FourPartAssessment sequence setup complete");
  } catch (error) { 
    logMessage(`Error setting up FourPartAssessment sequence: ${error}`);
  }
}