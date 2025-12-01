import { DataTypes, Model, Optional, Sequelize } from "sequelize"
import { ENV_PREFIX, MAIN_SCHEMA_NAME } from "../utils/constants"

interface TagsAttributes {
    rid : string
    created_by : string
    created_datetime : Date
    modified_by? : string
    modified_datetime? : Date
    tag_name : string
    status_rid : string
}

export interface TagsCreationAttributes 
extends Optional<TagsAttributes, "rid"> {}

export class Tags extends Model<TagsAttributes, TagsCreationAttributes>
implements TagsAttributes {
    public rid! : string
    public created_by! : string
    public created_datetime! : Date
    public modified_by? : string
    public modified_datetime? : Date
    public tag_name! : string
    public status_rid! : string 

    static initialise (sequelize : Sequelize, schemaName : string = MAIN_SCHEMA_NAME) {
        return Tags.init({
            rid : {
                type : DataTypes.STRING(50),
                defaultValue: Sequelize.literal(
                `'${ENV_PREFIX}' || gen_random_uuid()`),
                primaryKey : true
            },
            created_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            modified_by : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            created_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            modified_datetime : {
                type : DataTypes.DATE,
                allowNull : true
            },
            tag_name : {
                type : DataTypes.STRING(50),
                allowNull : true
            },
            status_rid : {
                type : DataTypes.STRING(50),
                allowNull : true
            }
        }, {
            sequelize,
            schema : schemaName ? schemaName : `${MAIN_SCHEMA_NAME}`,
            tableName : "tags",
            timestamps : false,
            underscored : true
        })
    }
}