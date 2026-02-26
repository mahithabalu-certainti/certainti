import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

/**
 * Table: trd365.data_mapper_form_mappings
 */
interface DataMapperFormMappingsAttributes {
    rid: string;
    created_datetime: Date;
    created_by: string;
    modified_datetime?: Date | null;
    modified_by?: string | null;

    form_rid: string;
    field_label: string;
    field_id?: string | null;
    calculation_config?: any | null;
    field_type?: string | null;
    column_id?: string | null;
    extraction_order?: number | null;
    status: string;
}

export interface DataMapperFormMappingsCreationAttributes
    extends Optional<
        DataMapperFormMappingsAttributes,
        | "rid"
        | "created_datetime"
        | "modified_datetime"
        | "modified_by"
        | "field_id"
        | "calculation_config"
        | "field_type"
        | "column_id"
        | "extraction_order"
    > { }

export class DataMapperFormMappings
    extends Model<DataMapperFormMappingsAttributes, DataMapperFormMappingsCreationAttributes>
    implements DataMapperFormMappingsAttributes {
    public rid!: string;

    public created_datetime!: Date;
    public created_by!: string;
    public modified_datetime?: Date | null;
    public modified_by?: string | null;

    public form_rid!: string;
    public field_label!: string;
    public field_id?: string | null;
    public calculation_config?: any | null;
    public field_type?: string | null;
    public column_id?: string | null;
    public extraction_order?: number | null;
    public status!: string;

    static initialize(
        sequelize: Sequelize,
        schemaName: string = MAIN_SCHEMA_NAME
    ) {
        return DataMapperFormMappings.init(
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
                field_label: {
                    type: DataTypes.STRING(500),
                    allowNull: false,
                },
                field_id: {
                    type: DataTypes.STRING(500),
                    allowNull: true,
                },
                calculation_config: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                },
                field_type: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                column_id: {
                    type: DataTypes.STRING(120),
                    allowNull: true,
                },
                extraction_order: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                status: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "data_mapper_form_mappings",
                timestamps: false,
                underscored: true,
            }
        );
    }

    static associate(models: any) {
        DataMapperFormMappings.belongsTo(models.DataMapperForms, {
            foreignKey: "form_rid",
            as: "dataMapperForm",
        });
    }
}
