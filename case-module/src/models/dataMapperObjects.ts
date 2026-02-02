import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

/**
 * Table: trd365.data_mapper_objects
 */
interface DataMapperObjectsAttributes {
    rid: string;
    created_by?: string | null;
    modified_by?: string | null;
    created_datetime?: Date | null;
    modified_datetime?: Date | null;
    country_rid?: string | null;
    state_rid?: string | null;
    ref_table?: string | null;
    field_name?: string | null;
    parent_object?: string | null;
    object_name?: string | null;
    is_json?: boolean | null;
    field_type?: string | null;
}

export interface DataMapperObjectsCreationAttributes
    extends Optional<
        DataMapperObjectsAttributes,
        | "rid"
        | "created_by"
        | "modified_by"
        | "created_datetime"
        | "modified_datetime"
        | "country_rid"
        | "state_rid"
        | "ref_table"
        | "field_name"
        | "parent_object"
        | "object_name"
        | "is_json"
        | "field_type"
    > { }

export class DataMapperObjects
    extends Model<DataMapperObjectsAttributes, DataMapperObjectsCreationAttributes>
    implements DataMapperObjectsAttributes {
    public rid!: string;
    public created_by?: string | null;
    public modified_by?: string | null;
    public created_datetime?: Date | null;
    public modified_datetime?: Date | null;
    public country_rid?: string | null;
    public state_rid?: string | null;
    public ref_table?: string | null;
    public field_name?: string | null;
    public parent_object?: string | null;
    public object_name?: string | null;
    public is_json?: boolean | null;
    public field_type?: string | null;

    static initialize(
        sequelize: Sequelize,
        schemaName: string = MAIN_SCHEMA_NAME
    ) {
        return DataMapperObjects.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                created_by: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                modified_by: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                created_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                modified_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                country_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                state_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                ref_table: {
                    type: DataTypes.STRING(225),
                    allowNull: true,
                },
                field_name: {
                    type: DataTypes.STRING(225),
                    allowNull: true,
                },
                parent_object: {
                    type: DataTypes.STRING(225),
                    allowNull: true,
                },
                object_name: {
                    type: DataTypes.STRING(225),
                    allowNull: true,
                },
                is_json: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                    allowNull: true,
                },
                field_type: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "data_mapper_objects",
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate(models: any) {
        // Define associations here if needed
    }
}