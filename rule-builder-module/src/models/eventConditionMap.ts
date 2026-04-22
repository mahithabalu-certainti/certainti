import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface EventConditionMapAttributes {
    rid: string;
    eid?: string | null;
    event_rid: string;
    condition_rid: string;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface EventConditionMapCreationAttributes
    extends Optional<EventConditionMapAttributes, "rid"> { }

export class EventConditionMap
    extends Model<EventConditionMapAttributes, EventConditionMapCreationAttributes>
    implements EventConditionMapAttributes {
    public rid!: string;
    public event_rid!: string;
    public condition_rid!: string;
    public created_by!: string;
    public modified_by?: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        EventConditionMap.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },

                eid: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                event_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                condition_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                created_by: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                modified_by: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                created_datetime: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },

                modified_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: DataTypes.NOW,
                },
            },
            {
                sequelize,
                modelName: "EventConditionMap",
                tableName: "event_conditions_map",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return EventConditionMap;
    }
}
