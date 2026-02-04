import { Model, DataTypes, Sequelize } from 'sequelize';
import { MAIN_SCHEMA_NAME, ENV_PREFIX } from "../utils/constants";

export class DocumentCategory extends Model {
    public rid!: string;
    public created_by!: string;
    public modified_by?: string;
    public created_datetime!: Date;
    public modified_datetime?: Date;
    public category_name!: string;
    public category_description?: string;

    public static initialize(sequelize: Sequelize) {
        DocumentCategory.init(
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
                category_name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                category_description: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
                },
            },
            {
                sequelize,
                tableName: 'document_category',
                schema: MAIN_SCHEMA_NAME,
                timestamps: false,
            }
        );
    }
}