import { Logger } from "winston";
import InteractionSchemaService from "./schemaService";
import { InteractionModelService } from "../interactionModelsService";
import { HttpStatus, rawQueries } from "../../utils/constants";
import { QueryTypes, Sequelize } from "sequelize";
import { logMessage } from "../../utils/helpers";

export class InteractionChildService {
  private interactionSchemaService: InteractionSchemaService;
  private interactionModelService: InteractionModelService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.interactionSchemaService = new InteractionSchemaService();
    this.interactionModelService = new InteractionModelService();
  }

  async listAiAssessmentAudit(
    data: any,
    page: number,
    limit: number,
    filters: Record<string, any>,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { auditInfo: any; count: number };
  }> {
    try {
      const { accountNumber } = await this.interactionSchemaService.fetchValidAccountNumberById(data.account_rid);
      if (!accountNumber) {
        logMessage(`Invalid account ID ${data.account_rid}`);
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "Invalid account ID",
        };
      }

      if (!this.mainDbSequelize) {
        this.mainDbSequelize = await this.interactionModelService.getMainSequelize();
      }
      if (!this.orgDbSequelize) {
        this.orgDbSequelize = await this.interactionModelService.getSequelize();
      }

      const offset = (page - 1) * limit;
      const schemaName = rawQueries.fetchSchemaName(accountNumber);

      const sortBy = data.sortBy || "created_datetime";
      const sortOrder = data.sortOrder || "DESC";

      let whereClauses: string[] = [`a.account_rid = :accountRid`];
      let replacements: any = { accountRid: data.account_rid };

      if (data.project_fiscal_rid) {
        whereClauses.push(`a.project_fiscal_rid = :projectFiscalRid`);
        replacements.projectFiscalRid = data.project_fiscal_rid;
      }

      if (data.case_rid) {
        whereClauses.push(rawQueries.fetchProjectFiscalRidsByCaseRidForWhere(schemaName));
        replacements.caseRid = data.case_rid;
      }

      // Handle search
      if (data.search) {
        let searchKeyword = `%${data.search}%`;
        // search usually isn't an explicit "created_by_name" filter, but if it implies DB columns:
        whereClauses.push(`(
          ad.account_name ILIKE :search OR 
          p.project_code ILIKE :search OR 
          a.transaction_id ILIKE :search
        )`);
        replacements.search = searchKeyword;
      }

      // Handle detail filters
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([field, filterObj]) => {
          if (!filterObj || typeof filterObj !== 'object') return;
          const operator = Object.keys(filterObj)[0];
          if (!operator) return;
          let value = (filterObj as any)[operator];
          if (value === undefined) return;

          let colRef = `a.${field}`;
          if (field === "project_code") colRef = `p.project_code`;
          if (field === "account_name") colRef = `ad.account_name`;
          if (field === "four_part_assessment") colRef = "CASE WHEN i.is_primary = true THEN 'Not Applicable' WHEN a.four_part_assessment_error_message IS NOT NULL AND a.four_part_assessment_error_message::text != 'null' THEN 'Failed' WHEN a.is_four_part_assessment_processed = true THEN 'Completed' ELSE 'Pending' END";
          if (field === "project_summary") colRef = "CASE WHEN i.is_primary = true THEN 'Not Applicable' WHEN a.technical_summary_error_message IS NOT NULL AND a.technical_summary_error_message::text != 'null' THEN 'Failed' WHEN a.is_tech_summary_processed = true THEN 'Completed' ELSE 'Pending' END";
          if (field === "qre_summary") colRef = "CASE WHEN i.is_primary = true THEN 'Not Applicable' WHEN a.qre_error_message IS NOT NULL AND a.qre_error_message::text != 'null' THEN 'Failed' WHEN a.is_qre_processed = true THEN 'Completed' ELSE 'Pending' END";
          if (field === "interaction_status") colRef = "CASE WHEN a.interaction_question_error_message IS NOT NULL AND a.interaction_question_error_message::text != 'null' THEN 'Failed' WHEN a.is_interaction_question_processed = true THEN 'Completed' ELSE 'Pending' END";

          const booleanFields = [
            "is_qre_processed",
            "is_tech_summary_processed",
            "is_interaction_question_processed",
            "is_four_part_assessment_processed",
            "data_ingestion"
          ];
          if (booleanFields.includes(field)) {
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            if (Array.isArray(value)) {
              value = value.map(v => v === 'true' ? true : v === 'false' ? false : v);
            }
          }

          const dateFields = ["created_datetime"];
          if (dateFields.includes(field)) {
            let paramKey = `${field}_val`;
            switch (operator.toLowerCase()) {
              case 'equals': {
                const date = new Date(value);
                whereClauses.push(`DATE(${colRef}) = DATE(:${paramKey})`);
                replacements[paramKey] = date.toISOString();
                break;
              }
              case 'before': {
                const date = new Date(value);
                whereClauses.push(`DATE(${colRef}) < DATE(:${paramKey})`);
                replacements[paramKey] = date.toISOString();
                break;
              }
              case 'after': {
                const date = new Date(value);
                whereClauses.push(`DATE(${colRef}) > DATE(:${paramKey})`);
                replacements[paramKey] = date.toISOString();
                break;
              }
              case 'between': {
                if (value && value.length === 2) {
                  const startDate = new Date(value[0]);
                  const endDate = new Date(value[1]);
                  whereClauses.push(`DATE(${colRef}) BETWEEN DATE(:${paramKey}_from) AND DATE(:${paramKey}_to)`);
                  replacements[`${paramKey}_from`] = startDate.toISOString();
                  replacements[`${paramKey}_to`] = endDate.toISOString();
                }
                break;
              }
              case 'is_empty':
                whereClauses.push(`${colRef} IS NULL`);
                break;
            }
            return;
          }

          let paramKey = `${field}_val`;
          switch (operator.toLowerCase()) {
            case 'equals':
              whereClauses.push(`${colRef} = :${paramKey}`);
              replacements[paramKey] = value;
              break;
            case 'not_equals':
              whereClauses.push(`(${colRef} != :${paramKey} OR ${colRef} IS NULL)`);
              replacements[paramKey] = value;
              break;
            case 'contains':
              whereClauses.push(`CAST(${colRef} AS TEXT) ILIKE :${paramKey}`);
              replacements[paramKey] = `%${value}%`;
              break;
            case 'is_empty':
              whereClauses.push(`(${colRef} IS NULL OR CAST(${colRef} AS TEXT) = '')`);
              break;
            case 'in':
              const valueArray = Array.isArray(value) ? value : [value];
              if (valueArray.length > 0) {
                whereClauses.push(`${colRef} IN (:${paramKey})`);
                replacements[paramKey] = valueArray;
              }
              break;
          }
        });
      }

      let whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      let dbSortBy = "a.created_datetime";
      let dbSortOrder = sortOrder;

      // Ensure proper collection reference for sorting
      if (sortBy === "project_code") dbSortBy = "p.project_code";
      else if (sortBy === "account_name") dbSortBy = "ad.account_name";
      else if (["four_part_assessment", "project_summary", "qre_summary", "interaction_status"].includes(sortBy)) {
        dbSortBy = sortBy;
      }
      else dbSortBy = `a.${sortBy}`;

      let dataQuery = rawQueries.fetchAiAssessmentAuditList(
        schemaName,
        whereString,
        dbSortBy,
        dbSortOrder
      );

      let countQuery = rawQueries.fetchAiAssessmentAuditCount(schemaName, whereString);

      replacements.limit = limit;
      replacements.offset = offset;

      // Fetch Raw Data
      let [audits, countResult] = await Promise.all([
        this.orgDbSequelize.query(dataQuery, { replacements, type: QueryTypes.SELECT }),
        this.orgDbSequelize.query(countQuery, { replacements, type: QueryTypes.SELECT })
      ]);

      let totalCount = parseInt((countResult as any)[0].totalCount, 10);

      if (audits.length === 0) {
        return {
          statusCode: HttpStatus.SUCCESS,
          message: HttpStatus.SUCCESS_MESSAGE,
          data: { auditInfo: [], count: 0 },
        };
      }

      let finalData = audits as any[];

      return {
        statusCode: HttpStatus.SUCCESS,
        message: HttpStatus.SUCCESS_MESSAGE,
        data: { auditInfo: finalData, count: totalCount },
      };
    } catch (err) {
      logMessage(`Error listing AI assessment audit: ${err}`); 
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: (err as Error).message,
      };
    }
  }
}
