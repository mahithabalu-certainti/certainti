import { Model, DataTypes, Optional, Sequelize } from "sequelize";

interface ColorCodesAttributes {
  rid: string;
  color_number: string;
  color_code: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
}

interface ColorCodesCreationAttributes
  extends Optional<ColorCodesAttributes, "rid"> {}

export class ColorCodes
  extends Model<ColorCodesAttributes, ColorCodesCreationAttributes>
  implements ColorCodesAttributes
{
  rid!: string;
  color_number!: string;
  color_code!: string;
  status!: string;
  created_datetime?: Date;
  modified_datetime?: Date;

  static initialize(sequelize: Sequelize) {
    ColorCodes.init(
      {
        rid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        color_number: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        color_code: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM("Active", "Inactive"),
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
        modelName: "ColorCodes",
        tableName: "color_codes",
        timestamps: false,
      }
    );
  }
}
