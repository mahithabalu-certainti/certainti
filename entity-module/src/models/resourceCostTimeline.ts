import { Model, DataTypes, UUIDV4, Sequelize, Optional } from "sequelize";
import { R_NUMBER_PREFIX } from "../utils/constants";

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
              // Get the latest cost timeline number and increment it
            const latestAccount = await ResourceCostTimeline.findOne({
              order: [['r_number', 'DESC']],
            });
            
            let nextNumber = '0000000001';
            if (latestAccount) {
              const currentNumber = parseInt(latestAccount.r_number?.split(' ')[1] || '0');
              nextNumber = (currentNumber + 1).toString().padStart(10, '0');
            }              
              resourceCostTimeline.r_number = `${R_NUMBER_PREFIX.RESOURCE_COST_TIMELINE} ${nextNumber}`;
            }
          }
        }
      }
    );
    return ResourceCostTimeline; 
  }
}
