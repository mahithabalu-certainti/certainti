import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import Department from "./departmentModel";
import FunctionGroup from "./functionGroupModel";
import { User } from "./userModel";

interface UserDetailsAttributes {
  rid: string;
  user_id?: string;
  serial_number?: number;
  mobile?: string;
  designation?: string;
  manager_name?: string;
  manager_email?: string;
  manager_employee_id?: string;
  employee_id?: string;
  employment_date?: Date;
  department_id?: string;
  function_group_id?: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface UserCreationAttributes
  extends Optional<UserDetailsAttributes, "rid"> {}

export class UserDetails
  extends Model<UserDetailsAttributes, UserCreationAttributes>
  implements UserDetailsAttributes
{
  public rid!: string;
  public user_id?: string;
  public serial_number?: number;
  public mobile?: string;

  public designation?: string;
  public manager_name?: string;
  public manager_email?: string;
  public manager_employee_id?: string;
  public employee_id?: string;
  public employment_date?: Date;
  public department_id?: string;
  public function_group_id?: string;

  public readonly created_datetime!: Date;
  public readonly modified_datetime!: Date;
}

UserDetails.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    serial_number: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manager_name: {
      type: DataTypes.STRING,
    },
    manager_email: {
      type: DataTypes.STRING,
    },
    manager_employee_id: {
      type: DataTypes.STRING,
    },
    employee_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    employment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "departments",
        key: "department_id",
      },
      onDelete: "NO ACTION",
    },
    function_group_id: {
      type: DataTypes.UUID,
      references: {
        model: "function_groups",
        key: "function_group_id",
      },
      onDelete: "NO ACTION",
    },
    created_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modified_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "UserDetails",
    tableName: "user_details",
    timestamps: false,
    hooks: {
      beforeValidate: async (user) => {
        if (user) {
          const latestUser = await UserDetails.findOne({
            order: [["serial_number", "DESC"]],
          });
          if (latestUser && latestUser.serial_number) {
            const serialNumber = latestUser ? latestUser.serial_number + 1 : 1;
            user.setDataValue("serial_number", serialNumber);
          }
        }
      },
      beforeUpdate: (user) => {
        user.setDataValue("modified_datetime", new Date());
      },
    },
  }
);

UserDetails.belongsTo(User, { foreignKey: "user_id" });
UserDetails.belongsTo(Department, { foreignKey: "department_id" });
UserDetails.belongsTo(FunctionGroup, { foreignKey: "function_group_id" });
