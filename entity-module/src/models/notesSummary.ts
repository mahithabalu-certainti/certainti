import { Model, DataTypes, Sequelize } from 'sequelize';
import { MAIN_SCHEMA_NAME, ENV_PREFIX, R_NUMBER_PREFIX } from "../utils/constants";

export class NotesSummary extends Model {
    rid!: string;
    r_number?: string;
    created_datetime!: Date;
    created_by!: string;
    modified_datetime?: Date;
    modified_by?: string | null;
    browse_file!: string;
    document_name!: string;
    account_rid!: string;
    attach_to!: string;
    attachment_level!: string;
    fiscal_year!: number;
    format!: string;
    size_in_mb!: number;
    title!: string;
    notes_owner!: string;
    descriptions ?: string | null;
    notes_rid! : string

    public static initialize(sequelize: Sequelize) {
    NotesSummary.init(
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
          unique: true
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
        account_rid: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        browse_file: {
          type: DataTypes.STRING(1000),
          allowNull: false,
        },
        document_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        notes_rid: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        attach_to: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        attachment_level: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        fiscal_year: {
          type: DataTypes.INTEGER,
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
        title: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        notes_owner: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        descriptions : {
          type: DataTypes.STRING(2000),
          allowNull: true,
        },
        },
        {
            sequelize,
            tableName: 'notes_summary',
            schema: MAIN_SCHEMA_NAME,
            timestamps: false,
        }
    );

    // ✅ Return the initialized model to use in associations
    return sequelize.models.NotesSummary as typeof NotesSummary;
}
}