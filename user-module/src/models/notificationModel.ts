import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX, MAIN_SCHEMA_NAME, R_NUMBER_PREFIX } from "../utils/constant";
import { NotificationStatus } from "./notificationStatusModel";

interface NotificationAttributes {
   rid: string;
  created_by: string;
  modified_by?: string | null;
  created_datetime?: Date;
  modified_datetime?: Date | null;
  user_rid: string;
  notification_message: string;
  status_rid: string;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, "rid"> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public rid!: string;
  public created_by!: string;
  public modified_by!: string | null;
  public created_datetime!: Date;
  public modified_datetime!: Date | null;
  public user_rid!: string;
  public notification_message!: string;
  public status_rid!: string;

  static initialize(sequelize: Sequelize) {
   //sequelize.query(`CREATE SEQUENCE IF NOT EXISTS usr_r_number_seq START 1;`);
    Notification.init(
      {
      rid: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modified_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_datetime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modified_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_rid: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    notification_message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status_rid: {
      type: DataTypes.STRING(50),
      allowNull: false,
    }
      },
      {
        sequelize,
        modelName: "Notification",
        tableName: "notifications",
        timestamps: false,
        schema : `${MAIN_SCHEMA_NAME}`
      }
    );
     Notification.belongsTo(NotificationStatus, {
         foreignKey: "status_rid",
         as: "notificationstatus",
       });

    return Notification;
  }
}
