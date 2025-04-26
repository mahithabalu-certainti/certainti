import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

interface ResourceSkillTimelineAttributes  {
 rid: string,
 r_number?: string,
 account_rid: string,
 event_name: string,
 event_status: string,
 event_type?: string,
 entity_rid: string
 event_datetime?: Date,
 modified_datetime?: Date,
 modified_by: string,
}

interface ResourceSkillTimelineCreationAttributes
  extends Optional<ResourceSkillTimelineAttributes, "rid"> {}

export class ResourceSkillTimeline extends Model<ResourceSkillTimelineAttributes, ResourceSkillTimelineCreationAttributes> implements ResourceSkillTimelineAttributes 
{
  rid!: string;
 r_number?: string;
 account_rid!: string;
 event_name!: string;
 event_status!: string;
 event_type?: string;
 event_datetime?: Date;
 entity_rid!: string;
 modified_datetime?: Date;
 modified_by!: string;

  static initialize(sequelize: Sequelize,schemaName: string) {
    ResourceSkillTimeline.init(
      {
       rid: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
       },
       r_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
       },
       account_rid: {
        type: DataTypes.UUID,
        allowNull: false,
       },
       event_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       event_status: {
        type: DataTypes.STRING(255),
        allowNull: false,
       },
       event_type: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "Ui Handler"
       },
       entity_rid: {
         type: DataTypes.UUID,
         allowNull: false,
       },
       event_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
       },
       modified_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
       },
       modified_by: {
        type: DataTypes.STRING(),
        allowNull: false,
       },
      },
      {
        sequelize,
        schema: schemaName,
        modelName: "ResourceSkillTimeline",
        tableName: "resource_skill_timeline",
        timestamps: false,
        hooks: {
          beforeCreate: async (resourceSkillTimeline: ResourceSkillTimeline) => {
            // Generate r_number if not provided
            if (!resourceSkillTimeline.r_number) {
              // Get the latest resource skill timeline to determine the next number
              const latestResourceSkillTimeline = await ResourceSkillTimeline.findOne({
                order: [['event_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestResourceSkillTimeline && latestResourceSkillTimeline.r_number) {
                const match = latestResourceSkillTimeline.r_number.match(/RST(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., RCT00001)
              resourceSkillTimeline.r_number = `RST${nextNumber.toString().padStart(5, '0')}`;
            }
          }
        }
      }
    );
    return ResourceSkillTimeline;
  }
}
