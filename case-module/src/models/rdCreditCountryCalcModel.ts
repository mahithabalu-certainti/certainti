import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface RdCreditCountryCalcAttributes {
    rid?: string;
    case_rid?: string;
    r_number?: string;
    country_rid?: string;
    input_params?: object | null;
    computed_fields?: object | null;
    total_qre?: number | null;
    average_annual_gross_receipts?: number | null;
    prev_year1_qre?: number | null;
    prev_year2_qre?: number | null;
    prev_year3_qre?: number | null;
    total_wages?: number | null;
    total_supplies?: number | null;
    total_subcontract?: number | null;
    config_json?:JSON
    final_credit?: number | null;
    created_datetime?: Date;
    modified_datetime?: Date;
    final_credit_submitted?: number | null;
    final_credit_approved?: number | null;
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
    public r_number? : string;
    public case_rid?: string;
    public country_rid?: string;
    public input_params?: object | null;
    public computed_fields?: object | null;
    public total_qre?: number | null;
    public average_annual_gross_receipts?: number | null;
    public prev_year1_qre?: number | null;
    public prev_year2_qre?: number | null;
    public prev_year3_qre?: number | null;
    public total_wages?: number | null;
    public total_supplies?: number | null;
    public total_subcontract?: number | null;
    public final_credit?: number | null;
    public config_json?: JSON;
    public created_datetime?: Date;
    public modified_datetime?: Date;
    public final_credit_submitted?: number | null;
    public final_credit_approved?: number | null;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditCountryCalculations.init(
            {
                rid: {
                    type: DataTypes.STRING(50),
                    primaryKey: true,
                    defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
                },
                r_number : {
                    type : DataTypes.STRING,
                    allowNull : true
                },
                case_rid: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
                country_rid: {
                    type: DataTypes.STRING(50),
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
                total_qre: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                average_annual_gross_receipts: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                prev_year1_qre: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                prev_year2_qre: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                prev_year3_qre: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                total_wages: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                total_supplies: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                total_subcontract: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                config_json: { 
                    type: DataTypes.JSONB, 
                    allowNull: false 
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
export async function setupRdCreditCountryCalculationSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".rd_credit_country_calculations_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".rd_credit_country_calculations
      ALTER COLUMN r_number SET DEFAULT 'RDCC-' || LPAD(nextval('"${schemaName}".rd_credit_country_calculations_seq')::text, 10, '0')`);

    logMessage("RDCredit Calculations sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up RDCredit Calculations sequence: ${error}`);
  }
}
