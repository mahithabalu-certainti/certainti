import { RuleMap } from "../models/workflowRuleMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRuleMap } from "../utils/types";
import { logMessage } from "../utils/helpers";


/**
 * Evaluate a rule for a given entity (case or task)
 */
export class RuleMapService {

  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async createRuleMap(rulemapRequest: ICreateRuleMap, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { ruleMap: any };
  }> {
    //const sequelize = await initSequelize();
    const sequelize = new Sequelize(process.env.POSTGRES_CONNECTION_STRING!, {
      dialect: "postgres",
      logging: false, // optional
    });
    // Initialize model ONCE
    RuleMap.initialize(sequelize);
    const condition = await RuleMap.create({
      rule_rid: rulemapRequest.rule_rid,
      scope_type_rid: rulemapRequest.scope_type_rid,
      apply_type: rulemapRequest.apply_type,
      created_by: rulemapRequest.created_by,
      modified_by: rulemapRequest.modified_by ?? rulemapRequest.created_by, // fallback to created_by if undefined
    });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: STATUS_MESSAGE.conditionCreated,
      data: {
        ruleMap: condition,
      },
    };
  };
}