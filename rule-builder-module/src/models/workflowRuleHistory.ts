import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleHistoryAttributes {
    rid?: string;
    r_number?: string | null;
    eid?: string | null;
    rule_rid: string;
    attribute_name: string;
    old_value: string | null;
    new_value: string | null;
    notes: string | null;
    action: string | null;
    created_by: string;
    modified_by: string | null;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface RuleHistoryCreationAttributes
    extends Optional<RuleHistoryAttributes, "rid"> { }

export class RuleHistory
    extends Model<RuleHistoryAttributes, RuleHistoryCreationAttributes>
    implements RuleHistoryAttributes {
    public rid!: string;
    public r_number!: string;
    public eid!: string;
    public rule_rid!: string;
    public attribute_name!: string;
    public old_value!: string;
    public new_value!: string;
    public notes!: string;
    public action!: string;
    public created_by!: string;
    public modified_by!: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        RuleHistory.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },

                r_number: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    unique: true,
                },

                eid: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                rule_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                attribute_name: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                old_value: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                new_value: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },

                notes: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                action: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                created_by: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },

                modified_by: {
                    type: DataTypes.INTEGER,
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
                modelName: "RuleHistory",
                tableName: "workflow_rule_history",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return RuleHistory;
    }
}