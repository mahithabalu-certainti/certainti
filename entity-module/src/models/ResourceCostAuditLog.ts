import { Model, DataTypes } from "sequelize";
import sequelize from "../config/dataSource";
import ResourceCost from "./ResourceCost";

export class ResourceCostAuditLog extends Model {
  public id!: number;
  public resource_cost_id!: number;
  public action!: string;
  public changed_by!: string;
  public changed_at!: Date;
  public change_details!: any;
}

ResourceCostAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    resource_cost_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ResourceCost,
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    change_details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "resource_cost_audit_log",
    sequelize,
    timestamps: false,
  }
);

ResourceCost.hasMany(ResourceCostAuditLog, {
  foreignKey: "resource_cost_id",
  as: "auditLogs",
});
ResourceCostAuditLog.belongsTo(ResourceCost, {
  foreignKey: "resource_cost_id",
  as: "resourceCost",
});

export default ResourceCostAuditLog;
