import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface RdCreditStateCalcAttributes {
    rid?: string;
    case_rid?: string;
    country_code?: string;
    region_name?: string;
    input_params?: object | null;
    computed_fields?: object | null;
    final_credit?: number | null;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface RdCreditStateCalcCreationAttributes
    extends Optional<RdCreditStateCalcAttributes, "rid"> { }

export class RdCreditStateCalculations
    extends Model<
        RdCreditStateCalcAttributes,
        RdCreditStateCalcCreationAttributes
    >
    implements RdCreditStateCalcAttributes {
    public rid?: string;
    public case_rid?: string;
    public country_code?: string;
    public region_name?: string;
    public input_params?: object | null;
    public computed_fields?: object | null;
    public final_credit?: number | null;
    public created_datetime?: Date;
    public modified_datetime?: Date;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditStateCalculations.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                case_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: true,
                },
                country_code: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                },
                region_name: {
                    type: DataTypes.STRING(20),
                    allowNull: true,
                },
                input_params: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                },
                computed_fields: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                },
                final_credit: {
                    type: DataTypes.DECIMAL(18, 2),
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
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "rd_credit_state_calculations",
                timestamps: false,
                underscored: true,
            }
        );
    }
}
