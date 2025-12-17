import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface RdCreditCountryCalcAttributes {
    rid?: string;
    case_rid?: string;
    country_rid?: string;
    input_params?: object | null;
    computed_fields?: object | null;
    final_credit?: number | null;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface RdCreditCountryCalcCreationAttributes
    extends Optional<RdCreditCountryCalcAttributes, "rid"> { }

export class RdCreditCountryCalculations
    extends Model<
        RdCreditCountryCalcAttributes,
        RdCreditCountryCalcCreationAttributes
    >
    implements RdCreditCountryCalcAttributes {
    public rid?: string;
    public case_rid?: string;
    public country_rid?: string;
    public input_params?: object | null;
    public computed_fields?: object | null;
    public final_credit?: number | null;
    public created_datetime?: Date;
    public modified_datetime?: Date;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditCountryCalculations.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                case_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                country_rid: {
                    type: DataTypes.STRING(20),
                    allowNull: false,
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
                tableName: "rd_credit_country_calculations",
                timestamps: false,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['case_rid', 'country_rid']
                    }
                ]
            }
        );
    }
}
