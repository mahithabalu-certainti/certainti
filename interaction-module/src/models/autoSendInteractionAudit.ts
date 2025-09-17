import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { MAIN_SCHEMA_NAME, ENV_PREFIX } from "../utils/constants";

export interface AutoSendInteractionAuditAttributes {
	rid: string;
	project_fiscal_rid: string;
	created_datetime?: Date;
	created_by?: string;
}

export interface AutoSendInteractionAuditCreationAttributes extends Optional<AutoSendInteractionAuditAttributes, "rid"> {}

export class AutoSendInteractionAudit extends Model<AutoSendInteractionAuditAttributes, AutoSendInteractionAuditCreationAttributes> implements AutoSendInteractionAuditAttributes {
	public rid!: string;
	public project_fiscal_rid!: string;
	public created_by?: string;
	public created_datetime?: Date;

	static initialize(sequelize: Sequelize, schemaName: string = MAIN_SCHEMA_NAME) {
		return AutoSendInteractionAudit.init(
			{
				rid: {
					type: DataTypes.STRING(50),
					defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
					primaryKey: true,
				},
				project_fiscal_rid: {
					type: DataTypes.STRING(50),
					allowNull: false,
				},
				created_by: {
					type: DataTypes.STRING(50),
					allowNull: true,
				},
				created_datetime: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: DataTypes.NOW,
				},
			},
			{
				sequelize,
				schema: schemaName,
				tableName: "autosend_interaction_audit",
				timestamps: false,
				underscored: true,
			}
		);
	}
}
