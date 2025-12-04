import { Sequelize, Model, DataTypes, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface OperatorCategoryMapAttributes {
    rid: string;
    eid?: string | null;
    operator_rid: string;
    category_rid: string;
    created_by: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface OperatorCategoryMapCreationAttributes
    extends Optional<OperatorCategoryMapAttributes, "rid"> { }

export class OperatorCategoryMap
    extends Model<OperatorCategoryMapAttributes, OperatorCategoryMapCreationAttributes>
    implements OperatorCategoryMapAttributes {
    public rid!: string;
    public operator_rid!: string;
    public category_rid!: string;
    public created_by!: string;
    public modified_by?: string;

    public readonly created_datetime!: Date;
    public readonly modified_datetime!: Date;

    static initialize(sequelize: Sequelize) {
        OperatorCategoryMap.init(
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

                operator_rid: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },

                category_rid: {
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
                modelName: "OperatorCategoryMap",
                tableName: "operator_category_map",
                schema: MAIN_SCHEMA_NAME,
                timestamps: false, // using custom timestamp columns
            }
        );

        return OperatorCategoryMap;
    }
}
