import { Model, DataTypes, Sequelize } from 'sequelize';
import { MAIN_SCHEMA_NAME, ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";
import { DocumentCategory } from './documentCategory';

export class DocumentType extends Model {
    public rid!: string;
    public created_by!: string;
    public modified_by?: string;
    public created_datetime!: Date;
    public modified_datetime?: Date;
    public type_name!: string;
    public type_description?: string;
    public category_rid!: string;

    public static initialize(sequelize: Sequelize) {
    DocumentType.init(
        {
            rid: {
                type: DataTypes.STRING(50),
                primaryKey: true,
                defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                allowNull: false,
            },
            created_by: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            modified_by: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            created_datetime: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                allowNull: true,
            },
            modified_datetime: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            type_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            type_description: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            category_rid: {
                type: DataTypes.STRING(50),
                allowNull: false,
                references: {
                    model: DocumentCategory,
                    key: 'rid',
                }
            }
        },
        {
            sequelize,
            tableName: 'document_type',
            schema: MAIN_SCHEMA_NAME,
            timestamps: false,
        }
    );

    // ✅ Return the initialized model to use in associations
    return sequelize.models.DocumentType as typeof DocumentType;
}
}