import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import { ENV_PREFIX } from "../utils/constant";

interface ColorCodesAttributes {
  rid: string;
  color_number: string;
  color_code: string;
  status: string;
  created_datetime?: Date;
  modified_datetime?: Date;
  created_by?: string;
  modified_by?: string;
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
  created_by?: string;
  modified_by?: string;

  static initialize(sequelize: Sequelize) {
    ColorCodes.init(
      {
        rid: {
          type: DataTypes.STRING(50),
          defaultValue: Sequelize.literal(`'${ENV_PREFIX}' || gen_random_uuid()`),
          primaryKey: true,
          allowNull: false,
        },
        created_by: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        modified_by: {
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
        }
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
