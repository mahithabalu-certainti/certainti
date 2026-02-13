
import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants";

export interface RdCreditCalculationsSummaryAttributes {
    rid?: string;
    r_number?: string;
    eid?: string;
    created_by?: string;
    modified_by?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
    credit_calculation_rid?: string;
    case_rid: string;
    country_rid: string;
    state_rid?: string | null;
    final_credit?: number | null;
    final_credit_submitted?: number | null;
    final_credit_approved?: number | null;
}

export interface RdCreditCalculationsSummaryCreationAttributes
    extends Optional<RdCreditCalculationsSummaryAttributes, "rid"> { }

export class RdCreditCalculationsSummary
    extends Model<
        RdCreditCalculationsSummaryAttributes,
        RdCreditCalculationsSummaryCreationAttributes
    >
    implements RdCreditCalculationsSummaryAttributes {
    public rid?: string;
    public r_number?: string;
    public eid?: string;
    public created_by?: string;
    public modified_by?: string;
    public created_datetime?: Date;
    public modified_datetime?: Date;
    public credit_calculation_rid!: string;
    public case_rid!: string;
    public country_rid!: string;
    public state_rid?: string | null;
    public final_credit?: number | null;
    public final_credit_submitted?: number | null;
    public final_credit_approved?: number | null;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditCalculationsSummary.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                r_number: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                },
                eid: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
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
                    defaultValue: DataTypes.NOW,
                },
                modified_datetime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: DataTypes.NOW,
                },
                credit_calculation_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                case_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                country_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                state_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                final_credit: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                final_credit_submitted: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                final_credit_approved: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
                tableName: "rd_credit_calculations_summary",
                timestamps: false,
                underscored: true,
            }
        );
    }
}
