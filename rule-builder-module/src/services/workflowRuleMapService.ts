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
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initSequelize();
    }
    return this.mainDbSequelize;
  }

  async createRuleMap(rulemapRequest: ICreateRuleMap, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { ruleMap: any };
  }> {
    const mainDb = await this.getMainDb();
    RuleMap.initialize(mainDb);
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