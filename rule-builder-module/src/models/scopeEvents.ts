import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface ScopeEventAttributes {
    rid: string;
    eid?: string | null;
    event_name: string;
    description: string;
    scope_type_rid: string;
    status_rid: string;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface ScopeEventCreationAttributes
    extends Optional<ScopeEventAttributes, "rid"> { }

export class ScopeEvent
    extends Model<ScopeEventAttributes, ScopeEventCreationAttributes>
    implements ScopeEventAttributes {
    public rid!: string;
    public eid!: string;
    public event_name!: string;
    public description!: string;
    public scope_type_rid!: string;
    public status_rid!: string;
    public created_by!: string;
    public modified_by?: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        ScopeEvent.init(
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

                event_name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                description: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                scope_type_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                status_rid: {
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
                modelName: "ScopeEvent",
                tableName: "scope_events",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return ScopeEvent;
    }
}
