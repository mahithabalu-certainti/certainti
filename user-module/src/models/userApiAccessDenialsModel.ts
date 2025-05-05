import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface UserApiAccessDenialsAttributes {
  rid: string;
  user_id: string;
  permission_id: string;
  permission_name: string;
  api_endpoint: string;
  created_datetime: Date;
  updated_datetime: Date;
}

export interface UserApiAccessDenialsCreationAttributes
  extends Optional<UserApiAccessDenialsAttributes, "rid" | "created_datetime" | "updated_datetime"> {}

export class UserApiAccessDenials
  extends Model<UserApiAccessDenialsAttributes, UserApiAccessDenialsCreationAttributes>
  implements UserApiAccessDenialsAttributes
{
  public rid!: string;
  public user_id!: string;
  public permission_id!: string;
  public permission_name!: string;
  public api_endpoint!: string;
  public created_datetime!: Date;
  public updated_datetime!: Date;

  static initialize(sequelize: Sequelize) {
    UserApiAccessDenials.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "user",
              key: "rid"
            }
          },
        permission_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: "module_permission",
              key: "rid"
            }
          },
        permission_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        api_endpoint: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "UserApiAccessDenials",
        tableName: "user_api_access_denials",
        timestamps: false,
        hooks: {
          beforeUpdate: (denial) => {
            denial.setDataValue("updated_datetime", new Date());
          },
        },
      }
    );
  }
}
