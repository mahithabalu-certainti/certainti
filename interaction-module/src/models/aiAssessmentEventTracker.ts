import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MAIN_SCHEMA_NAME } from "../utils/constants";

interface AiAssessmentEventTrackerAttributes {
  rid: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  event_name: string;
  is_active: boolean;
}

export interface AiAssessmentEventTrackerCreationAttributes
  extends Optional<AiAssessmentEventTrackerAttributes, "rid"> {}

export class AiAssessmentEventTracker
  extends Model<AiAssessmentEventTrackerAttributes, AiAssessmentEventTrackerCreationAttributes>
  implements AiAssessmentEventTrackerAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public event_name!: string;
  public is_active!: boolean;

  static initialize(
    sequelize: Sequelize,
    schemaName: string = MAIN_SCHEMA_NAME
  ) {
    const finalSchemaName = MAIN_SCHEMA_NAME;
    
    return AiAssessmentEventTracker.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
            `'D001-' || gen_random_uuid()`
          ),
          primaryKey: true,
        },
        created_by: { 
          type: DataTypes.STRING(50), 
          allowNull: false 
        },
        modified_by: { 
          type: DataTypes.STRING(50), 
          allowNull: true 
        },
        created_datetime: { 
          type: DataTypes.DATE, 
          allowNull: false, 
          defaultValue: DataTypes.NOW 
        },
        modified_datetime: { 
          type: DataTypes.DATE, 
          allowNull: true 
        },
        event_name: { 
          type: DataTypes.STRING(255), 
          allowNull: false 
        },
        is_active: { 
          type: DataTypes.BOOLEAN, 
          allowNull: false ,
          defaultValue: false
        },
      },
      {
        sequelize,
        schema: finalSchemaName,
        tableName: "ai_assessment_event_tracker",
        timestamps: false,
        underscored: true,
      }
    );
  }
}