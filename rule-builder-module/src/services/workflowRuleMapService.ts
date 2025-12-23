import { RuleMap } from "../models/workflowRuleMap";
import { initSequelize } from "../config/maindbDataSource";
import { Sequelize, Op } from "sequelize";
import { HttpStatus, STATUS_MESSAGE } from "../utils/constants";
import { Logger } from "winston";
import { ICreateRuleMap } from "../utils/types";
import { logMessage } from "../utils/helpers";
import { RuleHistoryService } from "./workflowRuleHistoryService";

/**
 * Evaluate a rule for a given entity (case or task)
 */
export class RuleMapService {

  private logger: Logger;
  private ruleHistoryService: RuleHistoryService;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.ruleHistoryService = new RuleHistoryService(this.logger);
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

  async updateRuleMap(rulemapRequest: any, userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { ruleMap: any };
  }> {
    const mainDb = await this.getMainDb();
    RuleMap.initialize(mainDb);
    const oldRuleMap = await RuleMap.findOne({ where: { rule_rid: rulemapRequest.rule_rid } });
    if (!oldRuleMap) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: "",
      };
    }

    const oldRuleData = oldRuleMap.toJSON(); const historyRecords = [];
    const fieldsToUpdate = [
      { field: 'apply_type', oldValue: oldRuleData.apply_type, newValue: rulemapRequest.apply_type }
    ];
    for (const { field, oldValue, newValue } of fieldsToUpdate) {
      if (oldValue !== newValue) {
        try {
          historyRecords.push({
            rule_rid: oldRuleData.rule_rid,
            attribute_name: field,
            old_value: oldValue,
            new_value: newValue,
            created_by: rulemapRequest.modified_by,
            action: 'ruleMapUpdate'
          });
        } catch (err) {
          console.log(err);
        }
      }
    }

    for (const history of historyRecords) {
      await this.ruleHistoryService.createHistory(history, userId);
    }
    const newRuleMap = await oldRuleMap.update({
      apply_type: rulemapRequest.apply_type,
      modified_by: rulemapRequest.modified_by, // fallback to created_by if undefined
      modified_datetime: new Date(),
    });

    return {
      statusCode: HttpStatus.SUCCESS,
      message: STATUS_MESSAGE.conditionCreated,
      data: {
        ruleMap: "",
      },
    };
  };
}