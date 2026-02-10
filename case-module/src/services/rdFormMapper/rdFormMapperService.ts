import { or, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import RdFormMapperSchemaService from "./schemaService";
import { generateSasUrl, logMessage, uploadBufferToAzureBlob } from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { Kafka, Producer } from "kafkajs";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { calculateFiscalYearDateRange } from "../../utils/dateFunction";
const PDFDocument = require("pdfkit");

enum ConfigType {
  NONE = "NONE",
  FEDERAL_ONLY = "FEDERAL_ONLY",
  STATE_ONLY = "STATE_ONLY",
  BOTH = "BOTH",
}
export class RdFormMapperService {
  private rdFormMapperSchemaService: RdFormMapperSchemaService;
  private rdCreditSchemaService: RDCreditSchemaService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private producer!: Producer;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rdFormMapperSchemaService = new RdFormMapperSchemaService();
    this.rdCreditSchemaService = new RDCreditSchemaService();
  }

  private async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  private async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  /**
   * Process Federal form filling
   */
  private async processFederalForms(
    accountRid: string,
    caseRid: string,
    countryRid: string,
    effectiveStart: string,
    effectiveEnd: string,
    accountNumber: string,
    mainDb: Sequelize,
    orgDb: Sequelize,
    schemaName: string,
    fiscalYear:string
  ): Promise<any> {
    logMessage("Processing Federal form computation.");

    const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
      accountRid,
      countryRid,
      mainDb,
      effectiveStart,
      effectiveEnd,
    );

    if (!formInfo?.browse_file && formInfo?.form_type === "fillable") {
      await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        countryRid,
        orgDb,
        accountNumber,
      );
    }

    logMessage(
      `Retrieved federal form. Browse file URL: ${formInfo.browse_file}`,
    );

    const mapperConfig =
      await this.rdFormMapperSchemaService.getRdFormMapperConfigurations(
        formInfo.rid,
      );

    if (!mapperConfig || mapperConfig.length === 0) {
      throw new Error(
        `No mapper configuration found for form RID: ${formInfo.rid}`,
      );
    }

    logMessage(`Found ${mapperConfig.length} federal mapper configuration(s)`);

    const enhancedMapperConfig =
      await this.enhanceMapperConfigWithDynamicValues(
        mapperConfig,
        accountRid,
        effectiveStart,
        caseRid,
        schemaName,
        fiscalYear,
        null,
        countryRid,
      );

    // Add debugging for form type
    logMessage(`Form type detected: "${formInfo?.form_type}"`);
    logMessage(`Form info: ${JSON.stringify(formInfo)}`);

    let filledFormUrl: string;

    if (
      formInfo?.form_type === "non-fillable" ||
      formInfo?.form_type === "non_fillable" ||
      formInfo?.form_type === "nonfillable"
    ) {
      logMessage("Federal form is non-fillable. Generate PDF.");
      filledFormUrl = await this.generatePDFNonFillable(
        enhancedMapperConfig,
        accountRid,
        formInfo.browse_file,
        accountNumber,
      );
    } else {
      logMessage("Federal form is fillable. Using PDF filler.");
      filledFormUrl = await pdfFiller(
        enhancedMapperConfig,
        accountRid,
        formInfo.browse_file,
        accountNumber,
      );
    }

    logMessage(
      `Federal PDF form filling completed. Filled form URL: ${filledFormUrl}`,
    );

     await this.rdFormMapperSchemaService.saveFederalFilledFormUrl(
       caseRid,
       countryRid,
       filledFormUrl,
       orgDb,
       accountNumber,
     );

    logMessage(
      `Successfully saved federal filled form URL for case: ${caseRid}`,
    ); 
    return {
      statusCode: HttpStatus.SUCCESS,
      message: "Federal form processed successfully",
      data:filledFormUrl
    }
  }

  /**
   * Process State form filling
   */
  private async processStateForms(
    accountRid: string,
    caseRid: string,
    countryRid: string,
    effectiveStart: string,
    effectiveEnd: string,
    accountNumber: string,
    mainDb: Sequelize,
    orgDb: Sequelize,
    states: string[],
    schemaName: string,
  ): Promise<void> {
    logMessage(
      `Processing State form computation for states: ${states.join(", ")}`,
    );

    for (const state of states) {
      logMessage(`Processing form for state: ${state}`);

      const formInfo = await this.rdFormMapperSchemaService.getStateForms(
        accountRid,
        countryRid,
        state,
        mainDb,
        effectiveStart,
        effectiveEnd,
      );

      if (!formInfo?.browse_file) {
        await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
        );
      }

      logMessage(
        `Retrieved state form for ${state}. Browse file URL: ${formInfo.browse_file}`,
      );

      const mapperConfig =
        await this.rdFormMapperSchemaService.getRdFormMapperConfigurations(
          formInfo.rid,
        );

      if (!mapperConfig || mapperConfig.length === 0) {
        throw new Error(
          `No mapper configuration found for state ${state}, form RID: ${formInfo.rid}`,
        );
      }

      logMessage(
        `Found ${mapperConfig.length} state mapper configuration(s) for ${state}`,
      );

      const enhancedMapperConfig =
        await this.enhanceMapperConfigWithDynamicValues(
          mapperConfig,
          accountRid,
          effectiveStart,
          caseRid,
          schemaName,
          undefined,
          state,
          countryRid,
        );

      const filledFormUrl = await pdfFiller(
        enhancedMapperConfig,
        accountRid,
        formInfo.browse_file,
        accountNumber,
      );

      logMessage(
        `State PDF form filling completed for ${state}. Filled form URL: ${filledFormUrl}`,
      );

      await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
        caseRid,
        state,
        filledFormUrl,
        orgDb,
        accountNumber,
      );
      logMessage(`Successfully saved state form URL for state: ${state}`);
    }

    logMessage(
      `Successfully completed state form processing for case: ${caseRid}`,
    );
  }

  /**
   * Generate PDF for non-fillable forms
   */
  private async generatePDFNonFillable(
    enhancedMapperConfig: any[],
    accountRid: string,
    browseFile: string,
    accountNumber: string,
  ): Promise<string> {
    try {
      // Transform mapper config to extract data for PDF generation
      const formData = enhancedMapperConfig.reduce((acc: any, config: any) => {
        acc[config.field_name || config.field_label] = config.value;
        return acc;
      }, {});

      logMessage(
        `Prepared form data with ${Object.keys(formData).length} fields for PDF generation`,
      );

      // Generate unique filename
      const fileName = `rd_form_${accountNumber}_${Date.now()}_${uuidv4().slice(0, 8)}.pdf`;

      // Create PDF document in memory
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      // Set up event handlers FIRST before any operations
      doc.on('data', buffers.push.bind(buffers));
      
      // Set up promise for completion before starting content generation
      const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(buffers);
          resolve(finalBuffer);
        });
        doc.on('error', reject);
        setTimeout(() => reject(new Error("PDF generation timeout")), 30000);
      });

      try {
        // Add header
        doc.fontSize(16).text("R&D Tax Credit Form", { align: "center" });

        doc.moveDown(1);

        // Add account information
        doc.fontSize(12).text(`Account: ${accountNumber}`);
        doc.text(`Account RID: ${accountRid}`);
        doc.moveDown(1);

        // Add form data
        doc.fontSize(10).text("Form Data:", { underline: true });
        doc.moveDown(0.5);

        // Add each field with its value
        Object.entries(formData).forEach(([fieldName, value]) => {
          doc.text(`${fieldName}: ${value || "N/A"}`);
          doc.moveDown(0.3);
        });

        // Add footer
        doc.moveDown(2);
        doc
          .fontSize(8)
          .text(`Generated on: ${new Date().toISOString()}`, {
            align: "center",
          });

        // Finalize the PDF
        doc.end();
      } catch (pdfError) {
        logMessage(`Error creating PDF content: ${pdfError}`);
        throw new Error(`PDF content creation failed: ${pdfError}`);
      }

      // Wait for PDF generation to complete and get buffer
      const pdfBuffer = await pdfBufferPromise;
      // Upload directly to blob storage from buffer
      const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, fileName, accountNumber);

      logMessage(`Non-fillable PDF generation completed. URL: ${blobUrl}`);
      return blobUrl;
    } catch (error) {
      this.logger.error("Error generating non-fillable PDF:", error);
      throw new Error(
        `Failed to generate non-fillable PDF: ${error instanceof Error ? error.message : error}`,
      );
    }
  }




  /**
   * Enhance mapper configuration with dynamic values from reference tables
   */
  private pushEnhancedConfig(
    enhancedConfigs: any[],
    configItem: any,
    value: any,
    overrides?: any,
  ) {
    enhancedConfigs.push({
      ...configItem,
      label: configItem.field_label,
      value_field_id: configItem.field_id,
      value,
      ...overrides,
    });
  }

  private stripIndexes(fieldRef: string) {
    return fieldRef.replace(/\[\d+\]/g, "");
  }

  private normalizeFieldRef(fieldRef: string) {
    const trimmed = fieldRef.trim();
    const lastSegment = trimmed.split(".").pop() || trimmed;
    return lastSegment.replace(/\[\d+\]$/, "");
  }

  private tryParseNumber(rawValue: any) {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return 0;
    }
    let rawString = String(rawValue);
    if (
      (rawString.startsWith("\"") && rawString.endsWith("\"")) ||
      (rawString.startsWith("'") && rawString.endsWith("'"))
    ) {
      rawString = rawString.slice(1, -1);
    }
    const hasPercent = rawString.includes("%");
    let normalized = rawString
      .replace(/,/g, "")
      .replace(/%/g, "")
      .replace(/\$/g, "")
      .trim();

    if (normalized.startsWith("(") && normalized.endsWith(")")) {
      normalized = `-${normalized.slice(1, -1)}`;
    }

    let num = Number(normalized);
    if (Number.isFinite(num) && hasPercent) {
      num = num / 100;
    }
    return Number.isFinite(num) ? num : null;
  }

  private transformIfExpressions(expression: string) {
    let result = expression;
    const ifRegex = /\bIF\s*\(/i;

    const splitTopLevel = (input: string) => {
      const parts: string[] = [];
      let buffer = "";
      let depth = 0;

      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === "(") depth++;
        if (ch === ")") depth--;

        if (ch === "," && depth === 0) {
          parts.push(buffer.trim());
          buffer = "";
        } else {
          buffer += ch;
        }
      }

      if (buffer.length > 0) {
        parts.push(buffer.trim());
      }

      return parts;
    };

    while (true) {
      const match = ifRegex.exec(result);
      if (!match) break;

      const ifIndex = match.index;
      const openIndex = result.indexOf("(", ifIndex);
      if (openIndex < 0) break;

      let depth = 0;
      let closeIndex = -1;
      for (let i = openIndex; i < result.length; i++) {
        const ch = result[i];
        if (ch === "(") depth++;
        if (ch === ")") {
          depth--;
          if (depth === 0) {
            closeIndex = i;
            break;
          }
        }
      }

      if (closeIndex < 0) break;

      const inner = result.slice(openIndex + 1, closeIndex);
      const parts = splitTopLevel(inner);
      if (parts.length !== 3) break;

      const [condition, whenTrue, whenFalse] = parts;
      const replacement = `(${condition} ? ${whenTrue} : ${whenFalse})`;
      result =
        result.slice(0, ifIndex) + replacement + result.slice(closeIndex + 1);
    }

    return result;
  }

  private async handleLineItemConfig(
    configItem: any,
    enhancedConfigs: any[],
    context: {
      accountRid: string;
      effectiveStart: string;
      caseRid: string;
      schemaName: string;
      stateRid?: string | null;
      countryRid?: string;
    },
  ) {
    let value = configItem.value;
    let calcConfig: any = configItem.calculation_config;

    if (typeof calcConfig === "string") {
      try {
        calcConfig = JSON.parse(calcConfig);
      } catch (error) {
        logMessage(
          `Error parsing calculation_config for field ${configItem.field_label}: ${error}`,
        );
      }
    }

    if (typeof calcConfig === "object" && !Array.isArray(calcConfig)) {
      const orderedTokens = Object.keys(calcConfig)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => String(calcConfig[key]).trim());

      const hasOperator = orderedTokens.some((token) =>
        [
          "add",
          "sub",
          "subtract",
          "mul",
          "div",
          "multiply",
          "divide",
          "min",
          "max",
        ].includes(token.toLowerCase()),
      );

      if (hasOperator) {
        const minMaxToken = orderedTokens.find((token) =>
          ["min", "max"].includes(token.toLowerCase()),
        );

        const expression = minMaxToken
          ? `${minMaxToken.toLowerCase()}(${orderedTokens
              .filter(
                (token) => !["min", "max"].includes(token.toLowerCase()),
              )
              .join(", ")})`
          : orderedTokens
              .map((token) => {
                switch (token.toLowerCase()) {
                  case "add":
                    return "+";
                  case "sub":
                  case "subtract":
                    return "-";
                  case "mul":
                  case "multiply":
                    return "*";
                  case "div":
                  case "divide":
                    return "/";
                  default:
                    return token;
                }
              })
              .join(" ");

        value = expression;
        logMessage(
          `Built expression for field ${configItem.field_label}: ${expression}`,
        );

        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        return;
      }
    }

    for (const key in calcConfig) {
      const rid = calcConfig[key];

      if (typeof rid === "number") {
        value = rid;
        logMessage(
          `Using numeric literal for field ${configItem.field_label}: ${rid}`,
        );
        continue;
      }

      if (typeof rid === "string") {
        const parsedLiteral = this.tryParseNumber(rid);
        if (parsedLiteral !== null && /[0-9]/.test(rid)) {
          value = parsedLiteral;
          logMessage(
            `Using numeric literal for field ${configItem.field_label}: ${parsedLiteral}`,
          );
          continue;
        }

        if (/^\s*(min|max)\s*\(/i.test(rid)) {
          value = rid;
          logMessage(
            `Using expression literal for field ${configItem.field_label}: ${rid}`,
          );
          continue;
        }

        if (rid.includes("#")) {
          value = rid;
          logMessage(
            `Using reference expression for field ${configItem.field_label}: ${rid}`,
          );
          continue;
        }
      }

      try {
        const mapperObject =
          await this.rdFormMapperSchemaService.getDataMapperObjectByRid(rid);
        if (mapperObject?.ref_table && mapperObject?.field_name) {
          const dynamicValue =
            await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
              mapperObject.ref_table,
              mapperObject.field_name,
              mapperObject.is_json,
              context.caseRid,
              context.schemaName,
              context.stateRid || "",
            );

          if (dynamicValue !== null) {
            value = dynamicValue;
            logMessage(
              `Fetched dynamic value for field ${configItem.field_label}: ${dynamicValue}`,
            );
          } else {
            logMessage(
              `No dynamic value for field ${configItem.field_label} (ref_table=${mapperObject.ref_table}, field_name=${mapperObject.field_name})`,
            );
          }
        } else {
          logMessage(
            `Missing mapperObject ref_table/field_name for field ${configItem.field_label} (rid=${rid})`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error fetching dynamic value for ${configItem.field_label}:`,
          error,
        );
      }
    }

    if (value === null || value === undefined || value === "") {
      logMessage(
        `Empty value resolved for field ${configItem.field_label} (field_id=${configItem.field_id})`,
      );
    }

    this.pushEnhancedConfig(enhancedConfigs, configItem, value);
  }

  private async handleTableConfig(
    configItem: any,
    enhancedConfigs: any[],
    context: {
      accountRid: string;
      caseRid: string;
      schemaName: string;
      fiscalYear?: string;
    },
  ) {
    if (configItem.column_id && configItem.calculation_config) {
      try {
        let mapperObject: any = null;
        for (const key in configItem.calculation_config) {
          const rid = configItem.calculation_config[key];
          mapperObject =
            await this.rdFormMapperSchemaService.getDataMapperObjectByRid(rid);
          break;
        }

        const columnIdList =
          await this.rdFormMapperSchemaService.getColumnIdListFromTableMappings(
            configItem.column_id,
          );

        if (columnIdList && mapperObject?.ref_table && mapperObject?.field_name) {
          let fieldMappings: any = {};

          try {
            if (typeof columnIdList === "string") {
              fieldMappings = JSON.parse(columnIdList);
            } else if (
              typeof columnIdList === "object" &&
              !Array.isArray(columnIdList)
            ) {
              fieldMappings = columnIdList;
            }
          } catch (parseError) {
            logMessage(`Error parsing column ID list as JSON: ${parseError}`);
            fieldMappings = {};
          }

          if (Object.keys(fieldMappings).length > 0) {
            const tableValues =
              await this.rdFormMapperSchemaService.fetchTableValues(
                mapperObject.ref_table,
                mapperObject.field_name,
                mapperObject.is_json || false,
                mapperObject.data_order_by,
                context.accountRid,
                context.caseRid,
                context.schemaName,
                context.fiscalYear,
              );

            Object.entries(fieldMappings).forEach(([rowNumber, fieldPath]) => {
              if (typeof fieldPath === "string") {
                const rowIndex = parseInt(rowNumber, 10) - 1;
                const rowValue = tableValues[rowIndex]?.value || "";
                this.pushEnhancedConfig(enhancedConfigs, configItem, rowValue, {
                  label: `${configItem.field_label}[row_${rowNumber}]`,
                  field_name: configItem.field_name,
                  value_field_id: fieldPath,
                });
              }
            });

            logMessage(
              `Created ${Object.keys(fieldMappings).length} table row mappings for field ${configItem.field_label}`,
            );
            return;
          }
        }

        this.pushEnhancedConfig(enhancedConfigs, configItem, "");
      } catch (error) {
        this.logger.error(
          `Error fetching table values for ${configItem.field_label}:`,
          error,
        );
        this.pushEnhancedConfig(enhancedConfigs, configItem, "");
      }
      return;
    }

    this.pushEnhancedConfig(enhancedConfigs, configItem, configItem.value);
  }

  private async enhanceMapperConfigWithDynamicValues(
    mapperConfig: any[],
    accountRid: string,
    effectiveStart: string,
    caseRid: string,
    schemaName: string,
    fiscalYear?: string,
    stateRid?: string | null,
    countryRid?: string,
  ): Promise<any[]> {
    const enhancedConfigs: any[] = [];
    const cachedTop15Sums: Record<string, number> = {};

    const getTop15SumByColumn = async (columnName: string) => {
      if (cachedTop15Sums[columnName] === undefined) {
        cachedTop15Sums[columnName] =
          await this.rdFormMapperSchemaService.fetchTop15ProjectSumByColumn(
            caseRid,
            schemaName,
            columnName,
          );
      }
      return cachedTop15Sums[columnName];
    };

    for (const configItem of mapperConfig) {
      let value = configItem.value;
      const fieldLabel = configItem.field_label;

      if (
        fieldLabel ===
          "Total from attachments -> 50 Direct research wages for qualified services" ||
        fieldLabel ===
          "Total from attachments -> 51 Direct supervision wages for qualified services" ||
        fieldLabel ===
          "Total from attachments -> 52 Direct support wages for qualified services"
      ) {
        const columnName =
          fieldLabel ===
          "Total from attachments -> 50 Direct research wages for qualified services"
            ? "total_cost_fte_prj"
            : fieldLabel ===
                "Total from attachments -> 51 Direct supervision wages for qualified services"
              ? "total_cost_subcon_prj"
              : "total_cost_nonlabor_prj";
        const top15Sum = await getTop15SumByColumn(columnName);
        value = top15Sum;
        logMessage(
          `Custom top-15 sum applied for field ${fieldLabel}: ${value}`,
        );
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        continue;
      }
      if (
        fieldLabel ===
        "Total from attachments -> 53 Total qualified wages (add line 50, line 51, and line 52)"
      ) {
        const line50 = await getTop15SumByColumn("total_cost_fte_prj");
        const line51 = await getTop15SumByColumn("total_cost_subcon_prj");
        const line52 = await getTop15SumByColumn("total_cost_nonlabor_prj");
        value = line50 + line51 + line52;
        logMessage(
          `Custom total qualified wages applied for field ${fieldLabel}: ${value}`,
        );
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        continue;
      }
      if (
        configItem.calculation_config &&
        configItem.field_type == "line-item"
      ) {
        await this.handleLineItemConfig(configItem, enhancedConfigs, {
          accountRid,
          effectiveStart,
          caseRid,
          schemaName,
          stateRid,
          countryRid,
        });
      } else if (configItem.field_type == "table") {
        await this.handleTableConfig(configItem, enhancedConfigs, {
          accountRid,
          caseRid,
          schemaName,
          fiscalYear,
        });
      } else {
        // Default case for other field types
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
      }
    }

    const valueMap = new Map<string, any>();
    const addToValueMap = (rawKey: string, value: any) => {
      if (!rawKey) return;
      valueMap.set(rawKey, value);

      const noIndexKey = this.stripIndexes(rawKey);
      valueMap.set(noIndexKey, value);

      const normalizedKey = this.normalizeFieldRef(rawKey);
      valueMap.set(normalizedKey, value);
    };

    enhancedConfigs.forEach((item) => {
      if (item.value_field_id) {
        addToValueMap(String(item.value_field_id), item.value);
      }
      if (item.field_id) {
        addToValueMap(String(item.field_id), item.value);
      }
      if (item.field_name) {
        addToValueMap(String(item.field_name), item.value);
      }
    });

    const maxExpressionPasses = 3;
    for (let pass = 1; pass <= maxExpressionPasses; pass++) {
      let passUpdated = false;

      enhancedConfigs.forEach((item) => {
        if (typeof item.value !== "string") return;
        const expression = item.value.trim();

        if (!expression.includes("#")) return;

        logMessage(
          `Evaluating expression for field value ${item.field_label || item.field_id}: ${expression}`,
        );

        let replaced = expression.replace(
          /#([^\s+\-*/(),]+)/g,
          (match: string) => {
            const rawKey = match.slice(1);
            if (!rawKey) return "NaN";

            const lookupKeys = [
              rawKey,
              this.stripIndexes(rawKey),
              this.normalizeFieldRef(rawKey),
            ];

            let hadKey = false;
            let hadValue: any = undefined;
            for (const key of lookupKeys) {
              if (valueMap.has(key)) {
                hadKey = true;
                hadValue = valueMap.get(key);
              }
              const num = this.tryParseNumber(valueMap.get(key));
              if (num !== null) {
                return String(num);
              }
            }

            if (hadKey) {
              logMessage(
                `Non-numeric expression reference for field ${item.field_label || item.field_id}: ${rawKey} (value=${JSON.stringify(hadValue)})`,
              );
            } else {
              logMessage(
                `Missing expression reference for field ${item.field_label || item.field_id}: ${rawKey}`,
              );
            }
            return "NaN";
          },
        );

        replaced = replaced
          .replace(/\bmin\s*\(/gi, "Math.min(")
          .replace(/\bmax\s*\(/gi, "Math.max(");

        replaced = this.transformIfExpressions(replaced);

        const validationTarget = replaced.replace(/Math\.(min|max)\(/g, "(");
        if (!/^[0-9+\-*/().,\sNaN?:<>=!&|]+$/.test(validationTarget)) {
          logMessage(
            `Blocked invalid expression for field ${item.field_label || item.field_id}: ${expression}`,
          );
          return;
        }

        try {
          const computed = Function(`"use strict"; return (${replaced});`)();
          if (typeof computed === "number" && Number.isFinite(computed)) {
            const lowerExpression = expression.toLowerCase();
            const hasSubtraction =
              lowerExpression.includes("-") ||
              lowerExpression.includes(" sub ") ||
              lowerExpression.includes("subtract");
            const finalValue = hasSubtraction && computed < 0 ? 0 : computed;

            item.value = finalValue;
            passUpdated = true;

            if (item.value_field_id) {
              addToValueMap(String(item.value_field_id), item.value);
            }
            if (item.field_id) {
              addToValueMap(String(item.field_id), item.value);
            }
            if (item.field_name) {
              addToValueMap(String(item.field_name), item.value);
            }

            logMessage(
              `Computed expression for field ${item.field_label || item.field_id}: ${expression} = ${finalValue}`,
            );
          } else {
            logMessage(
              `Could not compute expression for field ${item.field_label || item.field_id}: ${expression} (resolved=${replaced})`,
            );
          }
        } catch (error) {
          logMessage(
            `Error computing expression for field ${item.field_label || item.field_id}: ${expression} (resolved=${replaced})`,
          );
        }
      });

      if (!passUpdated) {
        break;
      }
    }
    return enhancedConfigs;
  }

  async processRdFormMapperRequests(message: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { task: any };
  }> {
    try {
      const parsedMessage =
        typeof message === "string" ? JSON.parse(message) : message;

      const {
        caseRid,
        accountRid,
        effectiveStart,
        effectiveEnd,
        accountNumber,
        schemaName,
        fiscalYear
      } = parsedMessage;
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();
      const [fetchAccountCountryId]: any[] = await mainDb.query(
        rawQueries.fetchAccountAndCountryDetails(accountRid),
      );
      const availableConfig =
        await this.rdFormMapperSchemaService.findAvailableCountryAndState(
          accountNumber,
          orgDb,
          caseRid,
        );
      const hasFederal = availableConfig.hasFederal;
      const hasState = availableConfig.hasState;
      let configLevelKey =
        hasFederal && hasState
          ? ConfigType.BOTH
          : hasFederal
            ? ConfigType.FEDERAL_ONLY
            : hasState
              ? ConfigType.STATE_ONLY
              : ConfigType.NONE;

      logMessage(`Config Level Key determined: ${configLevelKey}`);
      const executionConfigMap: Record<string, () => Promise<any>> = {
        [ConfigType.BOTH]: async () => {
          logMessage("Processing both Federal and State forms.");
          const federalResult = await this.processFederalForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            schemaName,
            fiscalYear
          );
          this.processStateForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            availableConfig.states || [],
            schemaName,
          ).catch((error) => {
            this.logger.error(
              `Error processing state forms in background for case ${caseRid}:`,
              error,
            );
          });
          return federalResult;
        },
        [ConfigType.FEDERAL_ONLY]: async () => {
          logMessage("Processing Federal forms only.");
          return await this.processFederalForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            schemaName,
            fiscalYear
          );
        },
        [ConfigType.STATE_ONLY]: async () => {
          logMessage("Processing State forms only.");
          await this.processStateForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            availableConfig.states || [],
            schemaName,
          );
          return {
            statusCode: HttpStatus.SUCCESS,
            message: "State forms processed successfully",
            data: {},
          };
        },
        [ConfigType.NONE]: async () => {
          throw new Error(
            "No configuration found for the specified jurisdiction",
          );
        },
      };

      const executeComputation = executionConfigMap[configLevelKey];
      if (!executeComputation) {
        throw new Error(`Invalid ConfigType: ${configLevelKey}`);
      }

      const result = await executeComputation();
      logMessage(
        `Successfully completed form mapper processing for case: ${caseRid}`,
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : err;
      logMessage(`Error processing RD Mapper requests: ${errorMessage}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:"Failed to process RD form mapper requests",
      };
    }
  }

  async initiateRDFormFillerProcess(
    accountRid: string,
    caseRid: string,
    fiscalYear: number,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      const mainDb = await this.getMainDb();
      const orgDb = await this.getOrgDb();
      const fetchParentAccountRnumber: any = await mainDb.query(
        await rawQueries.fetchParentAccount(accountRid, mainDb),
      );
      let schemaName = rawQueries.fetchSchemaName(
        fetchParentAccountRnumber[0][0].r_number,
      );
      const [isFinancialSignOffDone]: any[] = await orgDb.query(
        rawQueries.checkFinancialSignOffDone(schemaName, caseRid),
        { type: "SELECT" },
      );
      // if (!isFinancialSignOffDone.financial_working_signoff) {
      //   return {
      //     statusCode: HttpStatus.FAILED,
      //     message: HttpStatus.FAILED_MESSAGE,
      //     errorMessage: STATUS_MESSAGE.rdCreditFinancialSignOffPending,
      //   };
      // }

      const fetchAccountFiscalStartEndDate: any = await orgDb.query(
        rawQueries.fetchAccountStartEndDate(accountRid, schemaName),
      );
      const [splitMonthStart, splitDateStart] =
        fetchAccountFiscalStartEndDate[0][0].fiscal_start_date.split("/");
      const [splitMonthEnd, splitDateEnd] =
        fetchAccountFiscalStartEndDate[0][0].fiscal_end_date.split("/");
      const fetchedStartEndDate = calculateFiscalYearDateRange(
        splitMonthStart,
        splitMonthEnd,
        fiscalYear,
        splitDateStart,
        splitDateEnd,
      );
      let effectiveStart = fetchedStartEndDate.startDate;
      let effectiveEnd = fetchedStartEndDate.endDate;
      let payload = {
        accountRid,
        caseRid,
        effectiveStart,
        effectiveEnd,
        schemaName,
        accountNumber: fetchParentAccountRnumber[0][0].r_number
      }
      return await this.processRdFormMapperRequests(payload);
    } catch (error) {
      logMessage(`Error initiating RD Credit Process: ${error}`);

      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:
          STATUS_MESSAGE.rdCreditProcessInitiationFailed ||
          "Failed to initiate process",
      };
    }
  }

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      const kafka = new Kafka({
        clientId:
          process.env.KAFKA_CLIENT_ID_RD_FORM || "rd-form-filler-service",
        brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
      });
      this.producer = kafka.producer();
      await this.producer.connect();
    }
    return this.producer;
  }

  private async fetchUrlAsBase64(url: string): Promise<string> {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data).toString("base64");
  }

  /**
   * Initiates the RD Credit Process by publishing a message to Kafka.
   * @param accountRid
   * @param caseRid
   * @param effectiveStart
   * @param effectiveEnd
   * @returns
   */
  async initiateRDFormFiller(
    accountRid: string,
    caseRid: string,
    effectiveStart: string,
    effectiveEnd: string,
    schemaName: string,
    accountNumber: string,
  ) {
    try {
      const processRid = await this.rdCreditSchemaService.markAsInitiated(
        schemaName,
        caseRid,
        "rd_form",
      );
      const topic = process.env.KAFKA_TOPIC_RD_FORM || "rd_form_processor";
      let payload = {
        accountRid: accountRid,
        accountNumber: accountNumber,
        processRid: processRid,
        caseRid: caseRid,
        effectiveStart: effectiveStart,
        effectiveEnd: effectiveEnd,
      };
      const message = {
        value: JSON.stringify(payload),
      };

      const producer = await this.getProducer();
      const sendResult = await producer.send({
        topic,
        messages: [message],
      });
      logMessage(
        `RD Form Filler process initiated. Kafka send result: ${JSON.stringify(sendResult)}`,
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: STATUS_MESSAGE.rdFormProcessInitiatedSuccess,
        data: {},
      };
    } catch (error) {
      logMessage(`Error initiating RD Form Filler Process : ${error}`);
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:
          STATUS_MESSAGE.rdCreditProcessInitiationFailed ||
          "Failed to initiate RD credit process",
      };
    }
  }

  async getRdFormUrl(value: {
    account_rid: string;
    case_rid: string;
    fiscal_year: number;
    is_federal: boolean;
    country_rid: string;
    state_rid?: string;
  }): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: any;
  }> {
    try {
      // Validate input parameters
      if (!value.is_federal && !value.state_rid) {
        return this.createErrorResponse(
          STATUS_MESSAGE.detailFetchedFailed,
          "State RID is required for non-federal forms",
        );
      }

      const [mainDb, orgDb] = await Promise.all([
        this.getMainDb(),
        this.getOrgDb(),
      ]);

      const fetchParentAccountRnumber: any = await mainDb.query(
        await rawQueries.fetchParentAccount(value.account_rid, mainDb),
      );

      const accountNumber = fetchParentAccountRnumber[0]?.[0]?.r_number;
      if (!accountNumber) {
        return this.createErrorResponse(
          STATUS_MESSAGE.detailFetchedFailed,
          "Parent account not found",
        );
      }

      const results: {
        filled_form_url?: string | null;
        form_error_message?: string | null;
      } | null = value.is_federal
        ? await this.rdFormMapperSchemaService.getFederalFormUrl(
            value.case_rid,
            value.country_rid,
            orgDb,
            accountNumber,
          )
        : await this.rdFormMapperSchemaService.getStateFormUrl(
            value.case_rid,
            value.state_rid!,
            orgDb,
            accountNumber,
          );
      if (results?.filled_form_url) {
        try {
          const sasUrl = await generateSasUrl(results.filled_form_url, 300);
          results.filled_form_url = sasUrl
            ? await this.fetchUrlAsBase64(sasUrl)
            : null;
        } catch (error) {
          logMessage(`Error generating SAS URL: ${error}`);
          results.filled_form_url = null;
        }
      }

      return this.createSuccessResponse({
        rdformUrl: results?.filled_form_url || null,
        rdErrorMessage: results?.form_error_message || null,
      });
    } catch (error) {
      logMessage(`Error fetching RD Form URL: ${error}`);
      return this.createErrorResponse(
        STATUS_MESSAGE.jurisdictionFetchedFailed,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Creates a standardized success response
   */
  private createSuccessResponse(data: any) {
    return {
      statusCode: HttpStatus.SUCCESS,
      message: STATUS_MESSAGE.rdFormPreview,
      data,
    };
  }

  /**
   * Creates a standardized error response
   */
  private createErrorResponse(errorMessage: string, details?: string) {
    return {
      statusCode: HttpStatus.FAILED,
      message: HttpStatus.FAILED_MESSAGE,
      errorMessage,
      data: {},
      ...(details && { details }),
    };
  }
}
