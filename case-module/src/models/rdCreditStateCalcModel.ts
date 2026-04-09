import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";
import { logMessage } from "../utils/helpers";

export interface RdCreditStateCalcAttributes {
    rid?: string;
    r_number?: string;
    case_rid?: string;
    country_rid?: string;
    state_rid?: string;
    input_params?: object | null;
    computed_fields?: object | null;
    final_credit?: number | null;
    total_qre?: number | null;
    average_annual_gross_receipts?: number | null;
    prev_year1_qre?: number | null;
    prev_year2_qre?: number | null;
    prev_year3_qre?: number | null;
    prev_year4_qre?: number | null;
    total_wages?: number | null;
    total_supplies?: number | null;
    total_subcontract?: number | null;
    created_datetime?: Date;
    modified_datetime?: Date;
    final_credit_submitted?: number | null;
    final_credit_approved?: number | null;
    rd_form_url? : string | null
    form_error_message? : string | null;
    financial_calculation_error_message? : string | null;
    config_json?:JSON
    total_resources?: number | null;
}

export interface RdCreditStateCalcCreationAttributes
    extends Optional<RdCreditStateCalcAttributes, "rid"> { }

export class RdCreditStateCalculations
    extends Model<
        RdCreditStateCalcAttributes,
        RdCreditStateCalcCreationAttributes
    >
    implements RdCreditStateCalcAttributes {
    declare rid?: string;
    declare r_number?: string | undefined;
    declare case_rid?: string;
    declare country_rid?: string;
    declare state_rid?: string;
    declare input_params?: object | null;
    declare computed_fields?: object | null;
    declare final_credit?: number | null;
    declare total_qre?: number | null;
    declare average_annual_gross_receipts?: number | null
    declare prev_year1_qre?: number | null;
    declare prev_year2_qre?: number | null
    declare prev_year3_qre?: number | null;
    declare total_wages?: number | null;
    declare total_supplies?: number | null;
    declare total_subcontract?: number | null;
    declare created_datetime?: Date;
    declare modified_datetime?: Date;
    declare final_credit_submitted?: number | null;
    declare final_credit_approved?: number | null;
    declare rd_form_url? : string | null
    declare form_error_message? : string | null;
    declare config_json?: JSON;
    declare total_resources?: number | null;
    declare financial_calculation_error_message? :string | null;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditStateCalculations.init(
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
                    allowNull: true,
                },
                state_rid: {
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
                prev_year4_qre: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                total_wages: {type: DataTypes.DECIMAL(18, 2), allowNull: true, }, 
                total_supplies: { type: DataTypes.DECIMAL(18, 2), allowNull: true, },
                total_subcontract: { type: DataTypes.DECIMAL(18, 2), allowNull: true, },
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
                rd_form_url : {
                    type : DataTypes.STRING(500),
                    allowNull : true
                },
                form_error_message : {
                    type : DataTypes.STRING(500),
                    allowNull : true
                },
                config_json: {
                    type: DataTypes.JSONB,
                    allowNull: true
                },
                 total_resources: {
                    type: DataTypes.DECIMAL(18, 2),
                    allowNull: true,
                },
                financial_calculation_error_message: {
                     type: DataTypes.STRING(1000),
                     allowNull: true,
                 },
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "rd_credit_state_calculations",
                timestamps: false,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['case_rid', 'state_rid']
                    }
                ]
            }
        );
    }
}
export async function setupRdCreditStateCalculationSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".rd_credit_state_calculations_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".rd_credit_state_calculations
      ALTER COLUMN r_number SET DEFAULT 'RDCS-' || LPAD(nextval('"${schemaName}".rd_credit_state_calculations_seq')::text, 10, '0')`);

    logMessage("RDCredit Calculations sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up RDCredit Calculations sequence: ${error}`);
  }
}
