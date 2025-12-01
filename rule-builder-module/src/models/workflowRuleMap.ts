import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RuleMapAttributes {
    rid: string;
    eid?: string | null;
    r_number?: string | null;
    rule_rid: string;
    scope_type_rid: string;
    apply_type: number;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface RuleMapCreationAttributes
    extends Optional<RuleMapAttributes, "rid"> { }

export class RuleMap
    extends Model<RuleMapAttributes, RuleMapCreationAttributes>
    implements RuleMapAttributes {
    public rid!: string;
    public eid!: string;
    public r_number!: string;
    public rule_rid!: string;
    public scope_type_rid!: string;
    public apply_type!: number;
    public created_by!: string;
    public modified_by?: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        RuleMap.init(
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

                scope_type_rid: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },

                apply_type: {
                    type: DataTypes.INTEGER,
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
                modelName: "RuleMap",
                tableName: "workflow_rule_map",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return RuleMap;
    }
}
