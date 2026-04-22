import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface ValueCategoryMapAttributes {
    rid: string;
    eid?: string | null;
    value_rid: string;
    field_rid: string;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface ValueCategoryMapCreationAttributes
    extends Optional<ValueCategoryMapAttributes, "rid"> { }

export class ValueCategoryMap
    extends Model<ValueCategoryMapAttributes, ValueCategoryMapCreationAttributes>
    implements ValueCategoryMapAttributes {
    public rid!: string;
    public value_rid!: string;
    public field_rid!: string;
    public created_by!: string;
    public modified_by?: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        ValueCategoryMap.init(
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

                value_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                field_rid: {
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
                modelName: "ValueCategoryMap",
                tableName: "value_category_map",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return ValueCategoryMap;
    }
}
