import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";

interface ResourceCostTimelineAttributes  {
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

interface ResourceCostTimelineCreationAttributes
  extends Optional<ResourceCostTimelineAttributes, "rid"> {}

export class ResourceCostTimeline extends Model<ResourceCostTimelineAttributes, ResourceCostTimelineCreationAttributes> implements ResourceCostTimelineAttributes 
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

  static initialize(sequelize: Sequelize, schemaName: string) {
    ResourceCostTimeline.init(
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
        modelName: "ResourceCostTimeline",
        tableName: "resource_cost_timeline",
        timestamps: false,
        hooks: {
          beforeCreate: async (resourceCostTimeline: ResourceCostTimeline) => {
            // Generate r_number if not provided
            if (!resourceCostTimeline.r_number) {
              // Get the latest resource cost timeline to determine the next number
              const latestResourceCostTimeline = await ResourceCostTimeline.findOne({
                order: [['event_datetime', 'DESC']],
              });
              
              // Extract the numeric part if a previous record exists, or start with 1
              let nextNumber = 1;
              if (latestResourceCostTimeline && latestResourceCostTimeline.r_number) {
                const match = latestResourceCostTimeline.r_number.match(/RCT(\d+)/);
                if (match && match[1]) {
                  nextNumber = parseInt(match[1], 10) + 1;
                }
              }
              
              // Format the r_number with leading zeros (e.g., RCT00001)
              resourceCostTimeline.r_number = `RCT${nextNumber.toString().padStart(5, '0')}`;
            }
          }
        }
      }
    );
  }
}
