import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { Country } from "./countryModel";
interface StateAttributes {
  rid: string;
  r_number: string;
  country_rid: string;
  state_name: string;
  created_datetime?: Date;
  modified_datetime?: Date;
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
  created_datetime!: Date;
  modified_datetime!: Date;

  static initialize(sequelize: Sequelize) {
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
        created_datetime: {
          type: DataTypes.DATE,
          allowNull: false,
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
        modelName: "State",
        tableName: "state",
        timestamps: false,
      }
    );

    States.belongsTo(Country, {
      foreignKey: "country_rid",
      as: "country",
    });
  }
}
