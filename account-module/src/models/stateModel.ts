import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/dataSource";
import { Country } from "./countryModel";

interface StateAttributes {
  rid: string;
  r_number: string;
  country_rid: string;
  state_name: string;
}

interface StateCreationAttributes extends Optional<StateAttributes, "rid"> {}

export class States
  extends Model<StateAttributes, StateCreationAttributes>
  implements StateAttributes
{
  rid!: string;
  r_number!: string;
  country_rid!: string;
  state_name!: string;
}

States.init(
  {
    rid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    r_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country_rid: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    state_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "State",
    tableName: "state",
    timestamps: true,
  }
);

States.belongsTo(Country, {
  foreignKey: "country_rid",
  as: "country",
});
