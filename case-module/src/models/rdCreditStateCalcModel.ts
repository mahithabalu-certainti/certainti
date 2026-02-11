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
    public r_number?: string | undefined;
    public case_rid?: string;
    public country_rid?: string;
    public state_rid?: string;
    public input_params?: object | null;
    public computed_fields?: object | null;
    public final_credit?: number | null;
    public total_qre?: number | null;
    public average_annual_gross_receipts?: number | null
    public prev_year1_qre?: number | null;
    public prev_year2_qre?: number | null
    public prev_year3_qre?: number | null;
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
