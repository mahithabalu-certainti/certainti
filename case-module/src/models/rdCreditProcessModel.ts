import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface RdCreditProcessAttributes {
    rid?: string;
    case_rid?: string;
    status?: string;
    created_datetime?: Date;
    modified_datetime?: Date;
}

export interface RdCreditProcessCreationAttributes
    extends Optional<RdCreditProcessAttributes, "rid"> { }

export class RdCreditProcess
    extends Model<
        RdCreditProcessAttributes,
        RdCreditProcessCreationAttributes
    >
    implements RdCreditProcessAttributes {
    public rid?: string;
    public case_rid?: string;
    public status?: string;
    public created_datetime?: Date;
    public modified_datetime?: Date;

    static initialize(sequelize: Sequelize, schemaName: string) {
        return RdCreditProcess.init(
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
                status: {
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
            },
            {
                sequelize,
                schema: schemaName,
                tableName: "rd_credit_processing_status",
                timestamps: false,
                underscored: true,
            }
        );
    }
}
