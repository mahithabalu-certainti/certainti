import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { ENV_PREFIX } from "../utils/constants";

export interface AccountInteractionsAttributes {
  rid: string;
  r_number?: string;
  eid?: string;
  created_by: string;
  modified_by?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  account_rid: string;
  interaction_source_rid: string;
  interaction_type_rid: string;
  sent_on_datetime?: Date;
  template_rid?: string;
  status_rid: string;
}

export interface AccountInteractionsCreationAttributes extends Optional<AccountInteractionsAttributes, "rid"> {}

export class AccountInteractions extends Model<AccountInteractionsAttributes, AccountInteractionsCreationAttributes> implements AccountInteractionsAttributes {
  public rid!: string;
  public r_number!: string;
  public eid?: string;
  public created_by!: string;
  public modified_by?: string;
  public created_datetime?: Date;
  public modified_datetime?: Date;
  public account_rid!: string;
  public interaction_source_rid!: string;
  public interaction_type_rid!: string;
  public template_rid?: string;
  public status_rid!: string;
  public sent_on_datetime?: Date;

  static initialize(sequelize: Sequelize, schemaName: string) {
    return AccountInteractions.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(
                      `'${ENV_PREFIX}' || gen_random_uuid()`
                    ),
          primaryKey: true,
        },
        r_number: { type: DataTypes.STRING(50), allowNull: true },
        eid: { type: DataTypes.STRING(50), allowNull: true },
        created_by: { type: DataTypes.STRING(50), allowNull: true },
        modified_by: { type: DataTypes.STRING(50), allowNull: true },
        created_datetime: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
        modified_datetime: { type: DataTypes.DATE, allowNull: true },
        account_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_source_rid: { type: DataTypes.STRING(50), allowNull: true },
        interaction_type_rid: { type: DataTypes.STRING(50), allowNull: true },
        template_rid: { type: DataTypes.STRING(50), allowNull: true },
        status_rid: { type: DataTypes.STRING(50), allowNull: true },
        sent_on_datetime: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        schema: schemaName,
        tableName: "account_interactions",
        timestamps: false,
        underscored: true,
      }
    );
  }
}
