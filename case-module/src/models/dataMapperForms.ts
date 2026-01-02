import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

interface DataMapperFormsAttributes {
    rid: string;
    r_number?: string;
    created_datetime: Date;
    created_by: string;
    modified_datetime?: Date | null;
    modified_by?: string | null;
    form_name: string;
    browse_file: string;
    document_name: string;
    fiscal_year: number;
    country_rid: string;
    state_rid: string;
    format: string;
    size_in_mb: number;
    status_rid: string;
    status_description?: string | null;
    is_active: boolean;
}

export interface DataMapperFormsCreationAttributes
    extends Optional<DataMapperFormsAttributes, "rid" | "r_number" | "created_datetime" | "is_active"> { }

export class DataMapperForms
    extends Model<DataMapperFormsAttributes, DataMapperFormsCreationAttributes>
    implements DataMapperFormsAttributes {
    public rid!: string;
    public r_number?: string;
    public created_datetime!: Date;
    public created_by!: string;
    public modified_datetime?: Date | null;
    public modified_by?: string | null;
    public form_name!: string;
    public browse_file!: string;
    public document_name!: string;
    public fiscal_year!: number;
    public country_rid!: string;
    public state_rid!: string;
    public format!: string;
    public size_in_mb!: number;
    public status_rid!: string;
    public status_description?: string | null;
    public is_active!: boolean;

    static initialize(
        sequelize: Sequelize,
        schemaName: string = MAIN_SCHEMA_NAME
    ) {
        return DataMapperForms.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                r_number: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                    unique: true,
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
                form_name: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                browse_file: {
                    type: DataTypes.STRING(1000),
                    allowNull: false,
                },
                document_name: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                fiscal_year: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                country_rid: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                state_rid: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                format: {
                    type: DataTypes.STRING(10),
                    allowNull: false,
                },
                size_in_mb: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                },
                status_rid: {
                    type: DataTypes.STRING(120),
                    allowNull: false,
                },
                status_description: {
                    type: DataTypes.STRING(225),
                    allowNull: true,
                },
                is_active: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "data_mapper_forms",
                timestamps: false,
                underscored: true,
            }
        );
    }
}

export async function setupDataMapperFormsSequence(
    sequelize: Sequelize,
    schemaName: string
) {
    try {
        await sequelize.query(
            `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".data_mapper_form_seq 
       INCREMENT 1
       START 1
       MINVALUE 1
       MAXVALUE 9223372036854775807
       CACHE 1`
        );

        await sequelize.query(`
      ALTER TABLE "${schemaName}".data_mapper_forms
      ALTER COLUMN r_number SET DEFAULT 'DMF-' || LPAD(nextval('"${schemaName}".data_mapper_form_seq')::text, 5, '0')
    `);

        logMessage("DataMapperForms sequence setup complete");
    } catch (error) {
        logMessage(`Error setting up DataMapperForms sequence: ${error}`);
    }
}
