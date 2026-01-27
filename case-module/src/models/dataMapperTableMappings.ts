import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

/**
 * Table: trd365.data_mapper_table_mappings
 */
interface DataMapperTableMappingsAttributes {
    rid: string;
    created_datetime: Date;
    created_by: string;
    modified_datetime?: Date | null;
    modified_by?: string | null;

    form_rid: string;
    column_id_list?: any | null;
}

export interface DataMapperTableMappingsCreationAttributes
    extends Optional<
        DataMapperTableMappingsAttributes,
        | "rid"
        | "created_datetime"
        | "modified_datetime"
        | "modified_by"
        | "column_id_list"
    > { }

export class DataMapperTableMappings
    extends Model<DataMapperTableMappingsAttributes, DataMapperTableMappingsCreationAttributes>
    implements DataMapperTableMappingsAttributes {
    public rid!: string;
    public created_datetime!: Date;
    public created_by!: string;
    public modified_datetime?: Date | null;
    public modified_by?: string | null;

    public form_rid!: string;
    public column_id_list?: any | null;

    static initialize(
        sequelize: Sequelize,
        schemaName: string = MAIN_SCHEMA_NAME
    ) {
        return DataMapperTableMappings.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                created_datetime: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                created_by: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                modified_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                modified_by: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                form_rid: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                column_id_list: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                }
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "data_mapper_table_mappings",
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate(models: any) {
        // Associations can be added here
    }
}
