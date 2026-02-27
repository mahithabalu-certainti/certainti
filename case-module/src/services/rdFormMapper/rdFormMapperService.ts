import { or, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import RdFormMapperSchemaService from "./schemaService";
import { generateSasUrl, logMessage, uploadBufferToAzureBlob, uploadToAzureBlob } from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import { HttpStatus, rawQueries, RD_FORM_HEADER_BY_COUNTRY, STATUS_MESSAGE, COUNTRY_CURRENCY_CODE, FORM_TYPE } from "../../utils/constants";
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

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
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

  private async getCurrencySymbolByCountry(
    countryName: string,
    mainDb: Sequelize,
  ): Promise<string | null> {
    const normalized = countryName?.trim();
    if (!normalized) return null;

    const currencyCode = Object.entries(COUNTRY_CURRENCY_CODE).find(
      ([key]) => key.toLowerCase() === normalized.toLowerCase(),
    )?.[1];

    if (!currencyCode) return null;

    try {
      const [currencyRows]: any[] = await mainDb.query(
        rawQueries.getCurrencyByCode(currencyCode),
      );
      return currencyRows?.[0]?.currency_symbol || null;
    } catch (error) {
      logMessage(
        `Error fetching currency symbol for ${currencyCode}: ${error}`,
      );
      return null;
    }
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
    fiscalYear:string,
    countryCode: string,
    countryName: string,
    stateName: string,
    stateCode: string
  ): Promise<any> {
    logMessage("Processing Federal form computation.");

    const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
      accountRid,
      countryRid,
      mainDb,
      effectiveStart,
      effectiveEnd,
    );

    if (!formInfo?.browse_file && formInfo?.form_type === FORM_TYPE.Fillable) {
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
      formInfo?.form_type === FORM_TYPE["Non-Fillable"]
    ) {
      logMessage("Federal form is non-fillable. Generate PDF.");
      const currencySymbol = await this.getCurrencySymbolByCountry(
        countryName,
        mainDb,
      );
      filledFormUrl = await this.generatePDFNonFillable(
        enhancedMapperConfig,
        accountRid,
        formInfo.browse_file,
        accountNumber,
        caseRid,
        countryCode,
        true,
        countryName,
        stateName,
        fiscalYear,
        currencySymbol,
      );
    } else {
      logMessage("Federal form is fillable. Using PDF filler.");
      try {
        filledFormUrl = await pdfFiller(
          enhancedMapperConfig,
          accountRid,
          formInfo.browse_file,
          accountNumber,
          countryCode,
          stateCode || '',
          caseRid,
        );
      } catch (error) {
        logMessage(
          `Federal PDF fill failed. Falling back to non-fillable PDF generation. Error: ${error}`,
        );
        const currencySymbol = await this.getCurrencySymbolByCountry(
          countryName,
          mainDb,
        );
        filledFormUrl = await this.generatePDFNonFillable(
          enhancedMapperConfig,
          accountRid,
          formInfo.browse_file,
          accountNumber,
          caseRid,
          countryCode,
          true,
          countryName,
          stateName,
          fiscalYear,
          currencySymbol,
        );
      }
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
    fiscalYear: string,
    countryCode: string,
    countryName: string,
    stateName: string,
    stateCode: string
  ): Promise<void> {
    logMessage(
      `Processing State form computation for states: ${states.join(", ")}`,
    );

    const stateInfoMap = new Map<
      string,
      { state_name?: string; state_code?: string }
    >();

    if (states.length > 0) {
      const stateRows: any[] = await mainDb.query(
        rawQueries.fetchStatesByIds(),
        {
          replacements: { ids: states },
          type: QueryTypes.SELECT,
        },
      );
      stateRows.forEach((stateRow: any) => {
        stateInfoMap.set(stateRow.rid, {
          state_name: stateRow.state_name,
          state_code: stateRow.state_code,
        });
      });
    }

    for (const state of states) {
      const stateInfo = stateInfoMap.get(state) || {};
      const resolvedStateName = stateInfo.state_name || stateName || state;
      const resolvedStateCode = stateInfo.state_code || stateCode || "";

      logMessage(
        `Resolved state info for ${state}: ${JSON.stringify(stateInfo)}`,
      );
      logMessage(`Starting state form processing for state: ${state}`);
      logMessage(`Processing form for state: ${state}`);

      const formInfo = await this.rdFormMapperSchemaService.getStateForms(
        accountRid,
        countryRid,
        state,
        mainDb,
        effectiveStart,
        effectiveEnd,
      );

      if (!formInfo?.browse_file || !formInfo?.rid) {
        await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
        );
        logMessage(
          `No state form found for ${state}. Browse file URL: ${formInfo?.browse_file}`,
        );
        continue;
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

      let filledFormUrl: string;
      if (
      formInfo?.form_type === FORM_TYPE["Non-Fillable"]
    ) {
      logMessage("State form is non-fillable. Generate PDF.");
      const currencySymbol = await this.getCurrencySymbolByCountry(
        countryName,
        mainDb,
      );
      filledFormUrl = await this.generatePDFNonFillable(
        enhancedMapperConfig,
        accountRid,
        formInfo.browse_file,
        accountNumber,
        caseRid,
        countryCode,
        false,
        countryName,
        resolvedStateName,
        fiscalYear,
        currencySymbol,
      );
    } else {
      try {
        filledFormUrl = await pdfFiller(
          enhancedMapperConfig,
          accountRid,
          formInfo.browse_file,
          accountNumber,
          countryCode,
          resolvedStateCode,
          caseRid,
        );
      } catch (error) {
        logMessage(
          `PDF fill failed for state ${state}. Falling back to non-fillable PDF generation. Error: ${error}`,
        );
        const currencySymbol = await this.getCurrencySymbolByCountry(
          countryName,
          mainDb,
        );
        filledFormUrl = await this.generatePDFNonFillable(
          enhancedMapperConfig,
          accountRid,
          formInfo.browse_file,
          accountNumber,
          caseRid,
          countryCode,
          false,
          countryName,
          resolvedStateName,
          fiscalYear,
          currencySymbol,
        );
      }

      logMessage(
        `State PDF form filling completed for ${state}. Filled form URL: ${filledFormUrl}`,
      );
    }

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
    caseRid: string,
    countryCode: string,
    isFederal: boolean = false,
    countryName: string,
    stateName: string,
    fiscalYear: string,
    currencySymbol?: string | null,
  ): Promise<string> {
    try {
      const tableGroups = new Map<
        string,
        {
          columnOrder: string[];
          columns: Map<string, Map<number, any>>;
          rowIndexes: Set<number>;
        }
      >();
      const normalRows: { label: string; value: any }[] = [];

      enhancedMapperConfig.forEach((config: any) => {
        const columnLabel =
          config.field_label || config.field_name || config.label || "-";
        const value = config.value ?? "-";
        const labelText = String(config.label ?? columnLabel);
        const rowMatch = labelText.match(/\[row_(\d+)\]/i);
        const isTableRow =
          config.field_type === "table" ||
          (rowMatch && rowMatch.length > 1) ||
          config.column_id;

        if (isTableRow) {
          const baseLabel =
            labelText.replace(/\[row_\d+\]/i, "").trim() ||
            String(columnLabel);
          const rowIndex = rowMatch ? Number(rowMatch[1]) : 0;
          const tableKey =
            config.column_id !== undefined && config.column_id !== null
              ? String(config.column_id)
              : baseLabel;

          const group = tableGroups.get(tableKey) || {
            columnOrder: [],
            columns: new Map<string, Map<number, any>>(),
            rowIndexes: new Set<number>(),
          };

          const normalizedColumnLabel = String(columnLabel).trim() || "-";
          if (!group.columns.has(normalizedColumnLabel)) {
            group.columns.set(normalizedColumnLabel, new Map<number, any>());
            group.columnOrder.push(normalizedColumnLabel);
          }

          group.columns
            .get(normalizedColumnLabel)!
            .set(rowIndex, value);
          group.rowIndexes.add(rowIndex);
          tableGroups.set(tableKey, group);
          return;
        }

        normalRows.push({ label: labelText, value });
      });

      const tableCellCount = Array.from(tableGroups.values()).reduce(
        (total, group) => {
          let groupCells = 0;
          group.columns.forEach((rows) => {
            groupCells += rows.size;
          });
          return total + groupCells;
        },
        0,
      );

      logMessage(
        `Prepared form data with ${normalRows.length + tableCellCount} fields for PDF generation`,
      );

      // Generate unique filename
      const fileName = `rd_form_${countryCode}_${Date.now()}.pdf`;

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
        const pageWidth = doc.page.width;
        const left = doc.page.margins.left;
        const right = doc.page.margins.right;
        const usableWidth = pageWidth - left - right;

        // Add header
        const normalizedCountryName = countryName?.trim();
        const isAustralia = normalizedCountryName?.toLowerCase() === "australia";
        const headerTitle = normalizedCountryName
          ? RD_FORM_HEADER_BY_COUNTRY[normalizedCountryName] ||
            `R&D Tax Credit Form - ${normalizedCountryName}`
          : "R&D Tax Credit Form";
        doc.fontSize(16).text(headerTitle + '-' + fiscalYear, { align: "center" });

        doc.moveDown(1);

        // Add account information
        doc.fontSize(12).text(`Country: ${countryName}`);
        
        if (!isFederal) {
          doc.text(`State: ${stateName}`);
        }
        doc.moveDown(1);
        const colGap = 0;
        const colFieldWidth = Math.floor(usableWidth * 0.65);
        const colValueWidth = usableWidth - colFieldWidth - colGap;
        const rowPadding = 2;
        const headerHeight = doc.heightOfString("Field", {
          width: colFieldWidth - rowPadding * 2,
        }) + rowPadding * 2;

        const drawRowBorders = (y: number, rowHeight: number) => {
          const x1 = left;
          const x2 = left + colFieldWidth;
          doc.rect(x1, y, colFieldWidth, rowHeight).stroke();
          doc.rect(x2 + colGap, y, colValueWidth, rowHeight).stroke();
          doc.moveTo(x2, y).lineTo(x2, y + rowHeight).stroke();
        };


        const ensureSpace = (neededHeight: number) => {
          if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
          //  drawHeader();
          }
        };

      //  drawHeader();

        const formatValue = (rawValue: any) => {
          if (rawValue === null || rawValue === undefined || rawValue === "") {
            return "N/A";
          }

          const rawText = String(rawValue);
          if (!currencySymbol) return rawText;

          const numeric = this.tryParseNumber(rawValue);
          if (numeric !== null && /[0-9]/.test(rawText)) {
            return `${currencySymbol}${rawText}`;
          }

          return rawText;
        };

        const renderRow = (fieldName: string, value: any) => {
          const displayValue = formatValue(value);
          const fieldHeight = doc.heightOfString(String(fieldName), {
            width: colFieldWidth - rowPadding * 2,
          });
          const valueHeight = doc.heightOfString(String(displayValue), {
            width: colValueWidth - rowPadding * 2,
          });
          const rowHeight = Math.max(fieldHeight, valueHeight) + rowPadding * 2;

          ensureSpace(rowHeight);

          const y = doc.y;
          doc.text(String(fieldName), left + rowPadding, y + rowPadding, {
            width: colFieldWidth - rowPadding * 2,
          });
          doc.text(String(displayValue), left + colFieldWidth + colGap + rowPadding, y + rowPadding, {
            width: colValueWidth - rowPadding * 2,
            align: "right",
          });
          drawRowBorders(y, rowHeight);
          doc.y = y + rowHeight;
        };

        const renderGridRow = (
          cells: any[],
          align: "left" | "center" | "right",
          applyCurrency: boolean = false,
        ) => {
          const columnCount = cells.length;
          if (columnCount === 0) return;

          const baseWidth = Math.floor(usableWidth / columnCount);
          const colWidths = Array.from({ length: columnCount }, () => baseWidth);
          colWidths[columnCount - 1] =
            usableWidth - baseWidth * (columnCount - 1);

          const cellHeights = cells.map((cell, index) =>
            doc.heightOfString(
              String(applyCurrency ? formatValue(cell) : cell ?? ""),
              {
              width: (colWidths[index] ?? baseWidth) - rowPadding * 2,
              align,
            }),
          );
          const rowHeight = Math.max(...cellHeights, 0) + rowPadding * 2;

          ensureSpace(rowHeight);

          const y = doc.y;
          let x = left;
          cells.forEach((cell, index) => {
            const width = colWidths[index] ?? baseWidth;
            doc.rect(x, y, width, rowHeight).stroke();
            doc.text(
              String(applyCurrency ? formatValue(cell) : cell ?? ""),
              x + rowPadding,
              y + rowPadding,
              {
              width: width - rowPadding * 2,
              align,
            },
            );
            x += width;
          });

          doc.y = y + rowHeight;
        };

        normalRows.forEach((row) => {
          renderRow(row.label, row.value);
        });

        tableGroups.forEach((group) => {
          const headers = group.columnOrder.length
            ? group.columnOrder
            : ["-"];

          const rowIndexes = Array.from(group.rowIndexes).sort(
            (a, b) => a - b,
          );

          if (rowIndexes.length === 0) return;

          const normalizeHeader = (header: string) =>
            header.toLowerCase().replace(/\s+/g, " ").trim();
          const normalizedHeaders = headers.map(normalizeHeader);
          const isAustraliaTierTable =
            isAustralia &&
            normalizedHeaders.some((h) => h.includes("tier of intensity")) &&
            normalizedHeaders.some((h) => h.includes("notional")) &&
            normalizedHeaders.some((h) => h.includes("offset"));

          doc.moveDown(0.5);
          doc.fontSize(10);
          renderGridRow(headers, "center", false);
          rowIndexes.forEach((rowIndex) => {
            const rowValues = headers.map((header) => {
              const column = group.columns.get(header);
              if (!column) return "N/A";
              return column.has(rowIndex) ? column.get(rowIndex) : "N/A";
            });
            renderGridRow(rowValues, "right", true);
          });
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
      let blobName = `cases/${caseRid}/rdForms/${fileName}`;
    

      // Upload directly to blob storage from buffer
      const blobUrl = await uploadBufferToAzureBlob(
        pdfBuffer,
        blobName,
        accountNumber,
      );

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

    const normalizedLower = normalized.toLowerCase();
    if (normalizedLower === "yes" || normalizedLower === "true") {
      return 1;
    }
    if (normalizedLower === "no" || normalizedLower === "false") {
      return 0;
    }

    if (normalized.startsWith("(") && normalized.endsWith(")")) {
      normalized = `-${normalized.slice(1, -1)}`;
    }

    let num = Number(normalized);
    if (Number.isFinite(num) && hasPercent) {
      num = num / 100;
    }
    return Number.isFinite(num) ? num : null;
  }

  private normalizeExpressionSyntax(expression: string) {
    let result = expression;

    result = result.replace(/===/g, "==").replace(/!==/g, "!=");

    result = result.replace(/#YES\b/gi, "1").replace(/#NO\b/gi, "0");

    result = result.replace(
      /IF\s*\(([^)]*)\)\s*\{\s*THEN\s*([^}]*)\}\s*ELSE\s*\{\s*THEN\s*([^}]*)\}/gi,
      "IF($1, $2, $3)",
    );

    // Add # if missing before id pattern
    result = result.replace(
      /\b([A-Za-z]\d{3}-[0-9a-fA-F-]{36})\b/g,
      (match: string, offset: number, full: string) =>
        offset > 0 && full[offset - 1] === "#" ? match : `#${match}`,
    );

    // If #id is not resolved, do text comparison (replace with string comparison)
    // Replace #id == value or value == #id with String(value) == String(#id)
    result = result.replace(/#([A-Za-z]\d{3}-[0-9a-fA-F-]{36})\s*([!=]=)\s*([\w'\"-]+)/g, (m, id, op, val) => {
      return `String(#${id}) ${op} String(${val})`;
    });
    result = result.replace(/([\w'\"-]+)\s*([!=]=)\s*#([A-Za-z]\d{3}-[0-9a-fA-F-]{36})/g, (m, val, op, id) => {
      return `String(${val}) ${op} String(#${id})`;
    });

    return result;
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
        calcConfig = null;
      }
    }

    if (calcConfig && typeof calcConfig === "object" && !Array.isArray(calcConfig)) {
      // Enhanced: Support parentheses and operator precedence in config expressions
      // If config contains a special 'expression' key, use it directly
      if (calcConfig.expression && typeof calcConfig.expression === "string") {
        // Use the expression as-is (with references, parentheses, etc.)
        value = calcConfig.expression;
        logMessage(
          `Built complex expression for field ${configItem.field_label}: ${value}`,
        );
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        logMessage(`[DEBUG] [handleLineItemConfig] RETURN after expression for ${configItem.field_label}`);
        return;
      }

      // Otherwise, try to reconstruct an expression from the config keys/values
      const operatorMap: Record<string, string> = {
        add: "+",
        sub: "-",
        subtract: "-",
        mul: "*",
        multiply: "*",
        div: "/",
        divide: "/",
      };

      // If config contains a single key and it's a string with parentheses, treat as expression
      const keys = Object.keys(calcConfig);
      if (keys.length === 1) {
        const key0 = keys[0];
        if (typeof key0 === "string" && typeof calcConfig[key0] === "string") {
          const strVal = String(calcConfig[key0]).trim();
          if (/^[\s\S]*[()]+[\s\S]*$/.test(strVal)) {
            value = strVal;
            logMessage(
              `Detected parentheses expression for field ${configItem.field_label}: ${value}`,
            );
            this.pushEnhancedConfig(enhancedConfigs, configItem, value);
            logMessage(`[DEBUG] [handleLineItemConfig] RETURN after parentheses expr for ${configItem.field_label}`);
            return;
          }
        }
      }

      // Otherwise, build an infix expression, recursively flattening config objects and supporting parenthesized expressions
      const flattenConfigValue = (v: any): string => {
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          // Recursively flatten nested config objects
          const subKeys = Object.keys(v);
          const subTokens: string[] = [];
          for (const subKey of subKeys) {
            subTokens.push(flattenConfigValue(v[subKey]));
          }
          return subTokens.join(" ");
        }
        // If value is a string that looks like a parenthesized expression, return as-is
        if (typeof v === "string" && v.trim().match(/^\(.*\)$/)) {
          return v.trim();
        }
        // Otherwise, treat as string
        return String(v).trim();
      };

      const tokens: string[] = [];
      for (const key of keys) {
        const val = calcConfig[key];
        // If value looks like an operator, map it
        if (typeof val === "string" && operatorMap[val.toLowerCase()]) {
          const op = operatorMap[val.toLowerCase()];
          if (op) tokens.push(op);
        } else {
          tokens.push(flattenConfigValue(val));
        }
      }
      // Join tokens with spaces (infix), e.g. "A + B * (C + D)"
      const infixExpr = tokens.join(" ");
      // Always treat as expression if all tokens are numbers/operators/expressions
      const allTokensAreExpr = tokens.every(t => /^(\d+(\.\d+)?|[()+\-*/]|\(.*\))$/.test(t));
      if (/[()+\-*/]/.test(infixExpr) || allTokensAreExpr) {
        value = infixExpr;
        logMessage(
          `Built infix expression for field ${configItem.field_label}: ${value}`,
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
        logMessage(
          `Data mapper lookup for field ${configItem.field_label} (rid=${rid}): ${JSON.stringify(mapperObject)}`,
        );
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

          logMessage(
            `DB value for field ${configItem.field_label} (ref_table=${mapperObject.ref_table}, field_name=${mapperObject.field_name}): ${JSON.stringify(dynamicValue)}`,
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
    console.log(`[TableConfig] Processing config item: ${JSON.stringify(configItem)}`);
    // Only log warnings and resolved values for table config
    if (!configItem.column_id) {
      logMessage(`[TableConfig][WARN] Missing column_id for table item: ${configItem.field_label || configItem.field_id}`);
    }
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
            logMessage(`[TableConfig] Error parsing column ID list as JSON: ${parseError}`);
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
                logMessage(`[TableConfig] Mapping row ${rowNumber} to fieldPath ${fieldPath}, resolved rowValue: ${JSON.stringify(rowValue)}`);
                this.pushEnhancedConfig(enhancedConfigs, configItem, rowValue, {
                  label: `${configItem.field_label}[row_${rowNumber}]`,
                  field_name: configItem.field_name,
                  value_field_id: fieldPath,
                });
              } else {
                logMessage(`[TableConfig] Skipped mapping for row ${rowNumber} (fieldPath not string): ${JSON.stringify(fieldPath)}`);
              }
            });

            //
            return;
          }
        }

        this.pushEnhancedConfig(enhancedConfigs, configItem, "");
      } catch (error) {
        this.logger.error(
          `[TableConfig] Error fetching table values for ${configItem.field_label}:`,
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
        configItem.field_type == "Line-Item"
      ) {
        await this.handleLineItemConfig(configItem, enhancedConfigs, {
          accountRid,
          effectiveStart,
          caseRid,
          schemaName,
          stateRid,
          countryRid,
        });
      } else if (configItem.field_type == "Table-Item") {
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

    const resolveExpressionReferences = async () => {
      const seen = new Set<string>();

      for (const item of enhancedConfigs) {
        if (typeof item.value !== "string") continue;
        const expression = item.value.trim();
        const normalizedExpression = this.normalizeExpressionSyntax(expression);

        if (!normalizedExpression.includes("#")) continue;

        const matches = normalizedExpression.matchAll(/#([^\s+*/(),]+)/g);
        for (const match of matches) {
          const rawKey = match[1];
          if (!rawKey) continue;

          const rawKeyUpper = rawKey.toUpperCase();
          if (rawKeyUpper === "YES" || rawKeyUpper === "NO") continue;

          const lookupKeys = [
            rawKey,
            this.stripIndexes(rawKey),
            this.normalizeFieldRef(rawKey),
          ];

          if (lookupKeys.some((key) => valueMap.has(key))) continue;
          if (seen.has(rawKey)) continue;
          seen.add(rawKey);

          if (!/^[A-Za-z]\d{3}-[0-9a-fA-F-]{36}$/.test(rawKey)) continue;

          // Concise debug log for id resolution
          logMessage(`Resolving data mapper object for RID: ${rawKey}`);
          const mapperObject = await this.rdFormMapperSchemaService.getDataMapperObjectByRid(rawKey);

          if (!mapperObject?.ref_table || !mapperObject?.field_name) {
            logMessage(`RID not resolved: ${rawKey}. Using text comparison without #.`);
            addToValueMap(rawKey, rawKey.replace(/^#/, ""));
            continue;
          }

          const dynamicValue = await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
            mapperObject.ref_table,
            mapperObject.field_name,
            mapperObject.is_json,
            caseRid,
            schemaName,
            stateRid || "",
          );

          logMessage(`Resolved DB value for field ${item.field_label || item.field_id}: ${dynamicValue}`);

          if (dynamicValue !== null && dynamicValue !== undefined) {
            addToValueMap(rawKey, dynamicValue);
          }
        }
      }
    };

    await resolveExpressionReferences();

    const maxExpressionPasses = 3;
    // --- Optimized Expression Evaluation Loop ---
    for (let pass = 1; pass <= maxExpressionPasses; pass++) {
      let passUpdated = false;
      // Per-pass cache for resolved #labels and data_mapper_objects (Optimization 1)
      const evalCache = new Map();

      enhancedConfigs.forEach((item) => {
        if (typeof item.value !== "string") return;
        const expression = item.value.trim();
        if (!expression) return;

        // Normalize syntax (handles custom IF, label, etc.)
        const normalizedExpression = this.normalizeExpressionSyntax(expression);

        logMessage(
          `Evaluating expression for field value ${item.field_label || item.field_id}: ${expression}`,
        );

        // Defensive: Track resolved values for debugging and type safety
        const resolvedValues: Record<string, { rawValue: any; numeric: number }> = {};

        // --- Token Resolver with Caching and Defensive Guards ---
        // Optimization 3: Precompute lookupKeys and avoid repeated regex
        const lookupKeysCache: Record<string, string[]> = {};
        let replaced = normalizedExpression.replace(
          /#([^\s+*/(),]+)/g,
          (match: string) => {
            const rawKey = match.slice(1);
            if (!rawKey) return "NaN";

            // Use cache if available (prevents redundant DB/label lookups)
            if (evalCache.has(rawKey)) {
              const cached = evalCache.get(rawKey);
              resolvedValues[rawKey] = { rawValue: cached, numeric: this.tryParseNumber(cached) ?? 0 };
              return String(this.tryParseNumber(cached) ?? "NaN");
            }

            const rawKeyUpper = rawKey.toUpperCase();
            if (rawKeyUpper === "YES") {
              resolvedValues[rawKey] = { rawValue: "YES", numeric: 1 };
              evalCache.set(rawKey, 1);
              return "1";
            }
            if (rawKeyUpper === "NO") {
              resolvedValues[rawKey] = { rawValue: "NO", numeric: 0 };
              evalCache.set(rawKey, 0);
              return "0";
            }

            // Optimization 3: Cache lookup keys
            if (!lookupKeysCache[rawKey]) {
              lookupKeysCache[rawKey] = [rawKey, this.stripIndexes(rawKey), this.normalizeFieldRef(rawKey)];
            }
            const lookupKeys = lookupKeysCache[rawKey];
            let hadKey = false;
            let hadValue: any = undefined;
            for (const key of lookupKeys) {
              if (valueMap.has(key)) {
                hadKey = true;
                hadValue = valueMap.get(key);
              }
              // Optimization 4: Always use safe number conversion
              const num = this.tryParseNumber(valueMap.get(key));
              if (num !== null) {
                const rawValue = valueMap.has(key) ? valueMap.get(key) : null;
                resolvedValues[rawKey] = {
                  rawValue: rawValue === undefined ? null : rawValue,
                  numeric: num,
                };
                evalCache.set(rawKey, rawValue);
                logMessage(
                  `Expression reference for field ${item.field_label || item.field_id}: ${rawKey} -> ${JSON.stringify(valueMap.get(key))} (numeric=${num})`,
                );
                return String(num);
              }
            }

            if (hadKey) {
              logMessage(
                `Non-numeric expression reference for field ${item.field_label || item.field_id}: ${rawKey} (value=${JSON.stringify(hadValue)})`,
              );
              evalCache.set(rawKey, hadValue);
            } else {
              logMessage(
                `Missing expression reference for field ${item.field_label || item.field_id}: ${rawKey}`,
              );
              evalCache.set(rawKey, null);
            }
            return "NaN";
          },
        );

        // Defensive: Replace min/max, transform if(), and guard against malformed expressions
        replaced = replaced
          .replace(/\bmin\s*\(/gi, "Math.min(")
          .replace(/\bmax\s*\(/gi, "Math.max(");
        replaced = this.transformIfExpressions(replaced);

        // Defensive: Validate only allowed characters/operators
        const validationTarget = replaced.replace(/Math\.(min|max)\(/g, "(");
        if (!/^[0-9+\-*/().,\sNaN?:<>=!&|]+$/.test(validationTarget)) {
          logMessage(
            `Blocked invalid expression for field ${item.field_label || item.field_id}: ${expression}`,
          );
          item.value = "";
          return;
        }

        // --- Safe Evaluation ---
        try {
          // Defensive: Prevent division by zero and handle null/undefined
          // Optimization 7: Division by zero check
          const safeEval = (expr: string): number | null => {
            try {
              // Replace any division by zero with NaN
              const divZeroSafe = expr.replace(/(\d+)\s*\/\s*0(?!\d)/g, "NaN");
              // eslint-disable-next-line no-new-func
              const result = Function('return (' + divZeroSafe + ')')();
              // Defensive: Handle null, undefined, NaN, boolean, and non-finite numbers
              if (result === null || result === undefined || Number.isNaN(result)) return null;
              if (typeof result === "boolean") return result ? 1 : 0;
              if (typeof result === "number" && !Number.isFinite(result)) return null;
              return result;
            } catch (err) {
              return null;
            }
          };

          const computed = safeEval(replaced);
          if (computed !== null) {
            const lowerExpression = expression.toLowerCase();
            const hasSubtraction =
              lowerExpression.includes("-") ||
              lowerExpression.includes(" sub ") ||
              lowerExpression.includes("subtract");
            // Defensive: Clamp negative values for subtraction if required
            const finalValueRaw = hasSubtraction && computed < 0 ? 0 : computed;
            const finalValue = this.roundToTwoDecimals(finalValueRaw);

            item.value = finalValue;
            passUpdated = true;

            logMessage(
              `Final computed value for field ${item.field_label || item.field_id}: ${finalValue}`,
            );

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
            item.value = "";
          }
        } catch (error) {
          logMessage(
            `Error computing expression for field ${item.field_label || item.field_id}: ${expression} (resolved=${replaced}) - ${error}`,
          );
          item.value = "";
        }
      });

      if (!passUpdated) {
        break;
      }
    }

    const looksLikeExpression = (value: string) =>
      /#|\bIF\s*\(|\bTHEN\b|\bELSE\b/i.test(value);

    enhancedConfigs.forEach((item) => {
      if (typeof item.value !== "string") return;
      if (!looksLikeExpression(item.value)) return;

      logMessage(
        `Clearing unresolved expression for field ${item.field_label || item.field_id}: ${item.value}`,
      );
      item.value = "";
    });
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
            fiscalYear,
            fetchAccountCountryId[0].country_code,
            fetchAccountCountryId[0].country_name,
            '',
            ''
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
            fiscalYear,
            fetchAccountCountryId[0].country_code,
            fetchAccountCountryId[0].country_name,
            '',
            ''
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
            fiscalYear,
            fetchAccountCountryId[0].country_code,
            fetchAccountCountryId[0].country_name,
            '',
            ''
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
            fiscalYear,
             fetchAccountCountryId[0].country_code,
            fetchAccountCountryId[0].country_name,
            '',
            ''
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
      // if (
      //   !isFinancialSignOffDone ||
      //   !isFinancialSignOffDone.financial_working_signoff
      // ) {
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
        accountNumber: fetchParentAccountRnumber[0][0].r_number,
        fiscalYear
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
    // Set reasonable defaults to avoid unbounded memory usage and long-hanging requests.
    // Timeout in milliseconds (e.g., 30 seconds).
    const REQUEST_TIMEOUT_MS = 30_000;
    // Maximum response size in bytes (e.g., 50 MB).
    const MAX_CONTENT_LENGTH_BYTES = 50 * 1024 * 1024;

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: REQUEST_TIMEOUT_MS,
      maxContentLength: MAX_CONTENT_LENGTH_BYTES,
      maxBodyLength: MAX_CONTENT_LENGTH_BYTES,
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
  async signOffRdForms(data : any, file : any) {
          const mainDb = await this.getMainDb();
          const orgDb = await this.getOrgDb();
          const parentAccount : any = await mainDb.query(await rawQueries.fetchParentAccount(data.account_rid, mainDb));
          if(parentAccount[0].length > 0) {
              let schemaName = rawQueries.fetchSchemaName(parentAccount[0][0].r_number);
              const [caseDetails] : any = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
              if(file !== undefined) {
                  const fileUploadedResult = await uploadToAzureBlob(file, data.account_rid, '', parentAccount[0][0].r_number, 'signoff')
                  await orgDb.query(rawQueries.insertDataIntoAttachments(schemaName, data.case_rid, data.userId, data.account_rid, fileUploadedResult.url, fileUploadedResult.name, caseDetails?.fiscal_year, fileUploadedResult.extension, fileUploadedResult.size, data.comments))
              }
              const caseResult : any = await orgDb.query(rawQueries.updateRdFormSignOff(schemaName, data.case_rid, data.sign_off));
              if(caseResult[1].rowCount) {
                  const findRdFormSignOffId : any = await mainDb.query(rawQueries.getRdFormSignOffId());
                  await orgDb.query(rawQueries.insertSignoffDetails(data.userId, findRdFormSignOffId[0][0].rid, data.case_rid, data.account_rid, schemaName, data.comments))
                  return {
                      statusCode : HttpStatus.SUCCESS,
                      statusMessage : STATUS_MESSAGE.rdFormSignedOff
                  }
              } else {
                  return {
                      statusCode : HttpStatus.FAILED,
                      statusMessage : STATUS_MESSAGE.rdFormSignOffFailed
                  }
              }
          } else {
              return {
                      statusCode : HttpStatus.FAILED,
                      statusMessage : STATUS_MESSAGE.accountNoFound
                  }
          }
      }
}


