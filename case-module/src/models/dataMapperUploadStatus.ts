import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";
import { logMessage } from "../utils/helpers";

/**
 * Table: trd365.data_mapper_upload_status
 */
interface DataMapperUploadStatusAttributes {
    rid: string;
    created_datetime: Date;
    created_by?: string | null;
    modified_datetime?: Date | null;
    modified_by?: string | null;
    status_name: string;
    status_description?: string | null;
    status?: string | null;
}

export interface DataMapperUploadStatusCreationAttributes
    extends Optional<
        DataMapperUploadStatusAttributes,
        | "rid"
        | "created_datetime"
        | "created_by"
        | "modified_datetime"
        | "modified_by"
        | "status_description"
        | "status"
    > { }

export class DataMapperUploadStatus
    extends Model<DataMapperUploadStatusAttributes, DataMapperUploadStatusCreationAttributes>
    implements DataMapperUploadStatusAttributes {
    public rid!: string;
    public created_datetime!: Date;
    public created_by?: string | null;
    public modified_datetime?: Date | null;
    public modified_by?: string | null;
    public status_name!: string;
    public status_description?: string | null;
    public status?: string | null;

    static initialize(
        sequelize: Sequelize,
        schemaName: string = MAIN_SCHEMA_NAME
    ) {
        return DataMapperUploadStatus.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.literal(`'D001-' || gen_random_uuid()`),
                },
                created_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: DataTypes.NOW,
                },
                created_by: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                modified_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                modified_by: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                status_name: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                    unique: true
                },
                status_description: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
                status: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                }
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "data_mapper_upload_status",
                timestamps: false,
                underscored: true,
            }
        );
    }
}
