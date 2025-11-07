import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { logMessage } from "../utils/helpers";
import { ENV_PREFIX } from "../utils/constants";

interface CaseMilestoneAttributes {
    eid : string,
    rid : string,
    r_number? : string,
    created_by : string,
    modified_by? : string,
    created_datetime : Date,
    modified_datetime? : Date,
    milestone_name : string,
    milestone_description? : string,
    status_rid : string,
    case_filing_type_rid : string,
    account_rid : string,
    case_rid : string
}

export interface CaseMilestoneCreationAttributes
extends Optional<CaseMilestoneAttributes, "rid"> {}

export class CaseMilestone extends Model<CaseMilestoneAttributes, CaseMilestoneCreationAttributes>
implements CaseMilestoneAttributes {
    public eid! : string;
    public rid! : string;
    public r_number? : string;
    public created_by!: string;
    public modified_by?: string | undefined;
    public created_datetime! : Date;
    public modified_datetime?: Date | undefined;
    public milestone_name!: string;
    public milestone_description?: string | undefined;
    public status_rid!: string;
    public case_filing_type_rid! : string;
    public account_rid!: string;
    public case_rid!: string;

    static initialise(sequelize : Sequelize, schemaName : string) {
        return CaseMilestone.init({
            rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            eid : {
                type : DataTypes.STRING(50),
                defaultValue: Sequelize.literal(
                `'${ENV_PREFIX}' || gen_random_uuid()`
                ),
                primaryKey : true
            },
            r_number : {
                type : DataTypes.STRING(50),
                allowNull : true,
                unique: true,
            },
            created_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            modified_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            created_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            modified_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            milestone_name : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            milestone_description : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            status_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            case_filing_type_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            account_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            case_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName,
            tableName : "case_milestone",
            timestamps : false,
            underscored : true
        })
    }
}

export async function setupCaseMilestoneSequence(
  sequelize: Sequelize,
  schemaName: string
) {
  try {
    await sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "${schemaName}".case_milestone_seq START 1`
    );

    await sequelize.query(`ALTER TABLE "${schemaName}".case_milestone
      ALTER COLUMN r_number SET DEFAULT 'CSML-' || LPAD(nextval('"${schemaName}".case_milestone_seq')::text, 10, '0')`);

    logMessage("Cases sequence setup complete");
  } catch (error) {
    logMessage(`Error setting up Cases sequence: ${error}`);
  }
}