import { or, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import RdFormMapperSchemaService from "./schemaService";
import {
  generateSasUrl,
  logMessage,
  uploadBufferToAzureBlob,
  uploadToAzureBlob,
} from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import {
  HttpStatus,
  rawQueries,
  RD_FORM_HEADER_BY_COUNTRY,
  STATUS_MESSAGE,
  COUNTRY_CURRENCY_CODE,
  FORM_TYPE,
  eventTypes,
  entityTypes,
  eventNames,
} from "../../utils/constants";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { calculateFiscalYearDateRange } from "../../utils/dateFunction";
import { HelperMethods } from "../cases/helperMethods";
import { CaseModelService } from "../caseModelsService";
import { RdFormHelperService } from "./rdFormHelperService";
import { processMassachusettsForm } from "./maFormGenerator";
import { processNewJerseyForm } from "./njFormGenerator";
import { processSouthCarolinaForm } from "./scFormGenerator";
import { processWisconsinForm } from "./wiFormGenerator";
import { processConnecticutForm } from "./ctFormGenerator";
import { processNewMexicoForm } from "./nmFormGenerator";
import { processAustraliaForm } from "./ausFormGenerator";
const PDFDocument = require("pdfkit");

enum ConfigType {
  NONE = "NONE",
  FEDERAL_ONLY = "FEDERAL_ONLY",
  STATE_ONLY = "STATE_ONLY",
  BOTH = "BOTH",
}
export class RdFormMapperService {
  protected rdFormMapperSchemaService: RdFormMapperSchemaService;
  private rdCreditSchemaService: RDCreditSchemaService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;
  private helperMethod: HelperMethods;
  private helper: RdFormHelperService;
  private caseModelService: CaseModelService = new CaseModelService();
  constructor(logger: Logger) {
    this.logger = logger;
    this.rdFormMapperSchemaService = new RdFormMapperSchemaService();
    this.rdCreditSchemaService = new RDCreditSchemaService();
    this.helperMethod = new HelperMethods(this.caseModelService);
    this.helper = new RdFormHelperService(this.rdFormMapperSchemaService, logger);
  }

  /**
   * Gets or initializes the main database connection
   * @returns Promise<Sequelize> The main database instance
   */
  protected async getMainDb() {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  /**
   * Gets or initializes the organization database connection
   * @returns Promise<Sequelize> The organization database instance
   */
  protected async getOrgDb() {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }

  /**
   * Process Federal form filling for specified country
   * @param accountRid - Account RID
   * @param caseRid - Case RID
   * @param countryRid - Country RID
   * @param effectiveStart - Start date for effective period
   * @param effectiveEnd - End date for effective period
   * @param accountNumber - Account number
   * @param mainDb - Main database instance
   * @param orgDb - Organization database instance
   * @param schemaName - Schema name
   * @param fiscalYear - Fiscal year
   * @param countryCode - Country code
   * @param countryName - Country name
   * @param stateName - State name
   * @param stateCode - State code
   * @returns Promise containing status, message, and filled form URL
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
    fiscalYear: string,
    countryCode: string,
    countryName: string,
    stateName: string,
    stateCode: string,
  ): Promise<any> {
    let filledFormUrl: string;
    // If country is Ireland, generate dynamic PDF using generateIrelandCreditPdf FIRST
    const countryNameNorm = (countryName || "").trim().toLowerCase();
    if (countryNameNorm === "ireland" || countryNameNorm === "irl") {
      const filledFormUrl = await this.helper.generateIrelandCreditPdf(
        caseRid,
        schemaName,
        accountNumber,
      );
      await this.rdFormMapperSchemaService.saveFederalFilledFormUrl(
        caseRid,
        countryRid,
        filledFormUrl,
        orgDb,
        accountNumber,
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Federal form processed successfully",
        data: filledFormUrl,
      };
    } else if (
      countryNameNorm === "united kingdom" ||
      countryNameNorm === "uk" ||
      countryNameNorm === "gb"
    ) {
      return await this.helper.processUKForms(
        accountRid,
        caseRid,
        countryRid,
        accountNumber,
        mainDb,
        orgDb,
        schemaName,
        countryName,
      );
    } else if (countryNameNorm === "canada" || countryNameNorm === "can") {
      const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
        accountRid,
        countryRid,
        mainDb,
        effectiveStart,
        effectiveEnd,
      );
      if (!formInfo?.browse_file) {
        await this.rdFormMapperSchemaService.updateFederalFormError(
          caseRid,
          countryRid,
          orgDb,
          accountNumber,
          "No valid RD form data available to process",
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "Federal form processed successfully",
          data: '',
        };
      }
      const filledFormUrl = await this.helper.generateT661Pdf(
        caseRid,
        schemaName,
        accountNumber,
        formInfo.browse_file,
      );
      await this.rdFormMapperSchemaService.saveFederalFilledFormUrl(
        caseRid,
        countryRid,
        filledFormUrl,
        orgDb,
        accountNumber,
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Federal form processed successfully",
        data: filledFormUrl,
      };
    }
   else if (countryNameNorm === "australia" || countryNameNorm === "aus") {
      const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
        accountRid,
        countryRid,
        mainDb,
        effectiveStart,
        effectiveEnd,
      );
      if (!formInfo?.browse_file) {
        await this.rdFormMapperSchemaService.updateFederalFormError(
          caseRid,
          countryRid,
          orgDb,
          accountNumber,
          "No valid RD form data available to process",
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          message: "Federal form processed successfully",
          data: '',
        };
      }
      const filledFormUrl = await processAustraliaForm(
        caseRid,
        schemaName,
        accountNumber,
        formInfo.browse_file,
        orgDb,
        stateCode,
        countryCode,
      );
      await this.rdFormMapperSchemaService.saveFederalFilledFormUrl(
        caseRid,
        countryRid,
        filledFormUrl,
        orgDb,
        accountNumber,
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Federal form processed successfully",
        data: filledFormUrl,
      };
    }

    try {
      const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
        accountRid,
        countryRid,
        mainDb,
        effectiveStart,
        effectiveEnd,
      );

      if (!formInfo) {
        await this.rdFormMapperSchemaService.updateFederalFormError(
          caseRid,
          countryRid,
          orgDb,
          accountNumber,
          "No valid RD form data available to process",
        );
      }

      if (
        !formInfo?.browse_file &&
        formInfo?.form_type === FORM_TYPE.Fillable
      ) {
        await this.rdFormMapperSchemaService.updateFederalFormError(
          caseRid,
          countryRid,
          orgDb,
          accountNumber,
          "No valid RD form data available to process",
        );
      }

      const mapperConfig =
        await this.rdFormMapperSchemaService.getRdFormMapperConfigurations(
          formInfo.rid,
        );

      if (!mapperConfig || mapperConfig.length === 0) {
        await this.rdFormMapperSchemaService.updateFederalFormError(
          caseRid,
          countryRid,
          orgDb,
          accountNumber,
          `No valid RD form data available to process`,
        );
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: "No valid RD form data available to process",
          data: "",
        };
      }

      const enhancedMapperConfig =
        await this.helper.enhanceMapperConfigWithDynamicValues(
          mapperConfig,
          accountRid,
          effectiveStart,
          caseRid,
          schemaName,
          fiscalYear,
          null,
          countryRid,
        );

      // If country is Ireland, generate dynamic PDF using generateIrelandCreditPdf

      if (formInfo?.form_type === FORM_TYPE["Non-Fillable"]) {
        const currencySymbol = await this.helper.getCurrencySymbolByCountry(
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
          '',
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
            stateCode || "",
            caseRid,
          );
        } catch (error) {
          this.logger.warn(
            `Federal PDF fill failed. Falling back to non-fillable PDF generation. Error: ${error}`,
          );
          const currencySymbol = await this.helper.getCurrencySymbolByCountry(
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
            '',
            currencySymbol
          );
        }
      }

      await this.rdFormMapperSchemaService.saveFederalFilledFormUrl(
        caseRid,
        countryRid,
        filledFormUrl,
        orgDb,
        accountNumber,
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Federal form processed successfully",
        data: filledFormUrl,
      };
    } catch (error) {
      this.logger.error("Error processing federal form:", error);
      await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        countryRid,
        orgDb,
        accountNumber,
        "No valid RD form data available to process",
      );
      return {
        statusCode: HttpStatus.SUCCESS,
        message: "Federal form processed successfully",
        data: "",
      };
    }
  }

  /**
   * Process state-level form filling for specified states
   * @param accountRid - Account RID
   * @param caseRid - Case RID
   * @param countryRid - Country RID
   * @param effectiveStart - Start date for effective period
   * @param effectiveEnd - End date for effective period
   * @param accountNumber - Account number
   * @param mainDb - Main database instance
   * @param orgDb - Organization database instance
   * @param states - Array of state RIDs to process
   * @param schemaName - Schema name
   * @param fiscalYear - Fiscal year
   * @param countryCode - Country code
   * @param countryName - Country name
   * @param stateName - State name
   * @param stateCode - State code
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
    stateCode: string,
  ): Promise<void> {

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

    // Fetch project resources for all states to filter states with resources
    const projectResourceData: any[] = await orgDb.query(
      rawQueries.fetchProjectCountsAndQreByState(schemaName),
      {
        replacements: { case_rid: caseRid, stateRids: states },
        type: QueryTypes.SELECT,
      },
    );

    // Create a map of state_rid to resource count for quick lookup
    const stateResourceMap = new Map<string, number>();
    projectResourceData.forEach((data: any) => {
      stateResourceMap.set(
        data.state_rid,
        Number(data.total_resources || 0),
      );
    });

    for (const state of states) {
      // Skip states that have no project resources
      const totalResources = stateResourceMap.get(state) || 0;
      if (totalResources === 0) {
        this.logger.warn(
          `Skipping state ${state} as it has no project resources assigned.`,
        );
        this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
          "No project resources assigned for this state,",
        );
        continue;
      }

      const stateInfo = stateInfoMap.get(state) || {};
      const resolvedStateName = stateInfo.state_name || stateName || state;
      const resolvedStateCode = stateInfo.state_code || stateCode || "";

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
          "No valid RD form data available to process",
        );
        continue;
      }

      const mapperConfig =
        await this.rdFormMapperSchemaService.getRdFormMapperConfigurations(
          formInfo.rid,
        );

      if (!mapperConfig || mapperConfig.length === 0) {
        await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
          `No valid RD form data available to process`,
        );
        continue;
      }

      try {
        const enhancedMapperConfig =
          await this.helper.enhanceMapperConfigWithDynamicValues(
            mapperConfig,
            accountRid,
            effectiveStart,
            caseRid,
            schemaName,
            fiscalYear,
            state,
            countryRid,
          );

        let filledFormUrl: string;
        if (formInfo?.form_type === FORM_TYPE["Non-Fillable"]) {
          const currencySymbol = await this.helper.getCurrencySymbolByCountry(
            countryName,
            mainDb,
          );
          filledFormUrl = ''
          if (resolvedStateCode === "MA") {
             filledFormUrl = await processMassachusettsForm(
              caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,state,resolvedStateCode,countryCode
            );
            
          }
          if (resolvedStateCode === "NJ") {
            filledFormUrl = await processNewJerseyForm(
                caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,state,resolvedStateCode,countryCode
              );
             
          }
          if (resolvedStateCode === "SC") {
            filledFormUrl = await processSouthCarolinaForm(
              caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,resolvedStateCode,countryCode
            );
           
          }

          // if (resolvedStateCode === "WI") {
          //     filledFormUrl= await processWisconsinForm(
          //       caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb, state,resolvedStateCode,countryCode
          //     );
          // }
           if (resolvedStateCode === "WI") {
            filledFormUrl = await processWisconsinForm(
              caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
              state, resolvedStateCode, countryCode,
            );
          }
 
          // ── Connecticut CT-1120 RDC ───────────────────────────────────────
          if (resolvedStateCode === "CT") {
            filledFormUrl = await processConnecticutForm(
              caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,state,
              resolvedStateCode, countryCode,
            );
          }

            if (resolvedStateCode === "NM") {
            filledFormUrl = await processNewMexicoForm(
              caseRid, schemaName, accountNumber, formInfo.browse_file, orgDb,
              state,resolvedStateCode, countryCode,
            );
          }
          // filledFormUrl = await this.generatePDFNonFillable(
          //   enhancedMapperConfig,
          //   accountRid,
          //   formInfo.browse_file,
          //   accountNumber,
          //   caseRid,
          //   countryCode,
          //   false,
          //   countryName,
          //   resolvedStateName,
          //   fiscalYear,
          //   resolvedStateCode,
          //   currencySymbol,
          // );
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
            this.logger.warn(
              `PDF fill failed for state ${state}. Falling back to non-fillable PDF generation. Error: ${error}`,
            );
            const currencySymbol = await this.helper.getCurrencySymbolByCountry(
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
              resolvedStateCode,
              currencySymbol
            );
          }
        }

        await this.rdFormMapperSchemaService.saveStateFilledFormUrl(
          caseRid,
          state,
          filledFormUrl,
          orgDb,
          accountNumber,
        );
      } catch (error) {
        this.logger.error(`Error processing state form for ${state}:`, error);
        await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
          "No valid RD form data available to process",
        );
      }
    }
  }


  /**
   * Generate PDF for non-fillable forms
   * @param enhancedMapperConfig - Enhanced mapper configuration with computed values
   * @param accountRid - Account RID
   * @param browseFile - Template file path/URL
   * @param accountNumber - Account number
   * @param caseRid - Case RID
   * @param countryCode - Country code
   * @param isFederal - Whether this is a federal form
   * @param countryName - Country name
   * @param stateName - State name
   * @param fiscalYear - Fiscal year
   * @param currencySymbol - Optional currency symbol for formatting
   * @returns Promise<string> URL of the generated PDF
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
    stateCode: string,
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
            labelText.replace(/\[row_\d+\]/i, "").trim() || String(columnLabel);
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

          group.columns.get(normalizedColumnLabel)!.set(rowIndex, value);
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



      // Generate unique filename
      const fileName = `rd_form_${countryCode}${stateCode ? `_${stateCode}` : ''}_${Date.now()}.pdf`;

      // Create PDF document in memory
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      // Set up event handlers FIRST before any operations
      doc.on("data", buffers.push.bind(buffers));

      // Set up promise for completion before starting content generation
      const pdfBufferPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => {
          const finalBuffer = Buffer.concat(buffers);
          resolve(finalBuffer);
        });
        doc.on("error", reject);
        setTimeout(() => reject(new Error("PDF generation timeout")), 30000);
      });

      try {
        const pageWidth = doc.page.width;
        const left = doc.page.margins.left;
        const right = doc.page.margins.right;
        const usableWidth = pageWidth - left - right;

        // Add header
        const normalizedCountryName = countryName?.trim();
        const isAustralia =
          normalizedCountryName?.toLowerCase() === "australia";
        const headerTitle = normalizedCountryName
          ? RD_FORM_HEADER_BY_COUNTRY[normalizedCountryName] ||
          `R&D Tax Credit Form - ${normalizedCountryName}`
          : "R&D Tax Credit Form";
        doc
          .fontSize(16)
          .text(headerTitle + "-" + fiscalYear, { align: "center" });

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
        // Increased padding for each row
        const rowPadding = 8;
        const headerHeight =
          doc.heightOfString("Field", {
            width: colFieldWidth - rowPadding * 2,
          }) +
          rowPadding * 2;

        const drawRowBorders = (y: number, rowHeight: number) => {
          const x1 = left;
          const x2 = left + colFieldWidth;
          doc.rect(x1, y, colFieldWidth, rowHeight).stroke();
          doc.rect(x2 + colGap, y, colValueWidth, rowHeight).stroke();
          doc
            .moveTo(x2, y)
            .lineTo(x2, y + rowHeight)
            .stroke();
        };

        const ensureSpace = (neededHeight: number) => {
          if (
            doc.y + neededHeight >
            doc.page.height - doc.page.margins.bottom
          ) {
            doc.addPage();
            //  drawHeader();
          }
        };

        //  drawHeader();

        const formatValue = (rawValue: any) => {
          if (rawValue === null || rawValue === undefined || rawValue === "") {
            return "N/A";
          }

          if (rawValue === 0 || rawValue === "0") {
            return "-";
          }

          const rawText = String(rawValue);
          if (!currencySymbol) return rawText;

          const numeric = this.helper.tryParseNumber(rawValue);
          if (numeric !== null && /[0-9]/.test(rawText)) {
            return `${currencySymbol}${rawText}`;
          }

          return rawText;
        };

        const renderRow = (fieldName: string, value: any) => {
          // Defensive: Ensure fieldName and value are never undefined/null
          const safeFieldName =
            fieldName !== undefined && fieldName !== null ? fieldName : "N/A";
          const displayValue = formatValue(
            value !== undefined && value !== null ? value : "N/A",
          );
          const fieldHeight = doc.heightOfString(String(safeFieldName), {
            width: colFieldWidth - rowPadding * 2,
          });
          const valueHeight = doc.heightOfString(String(displayValue), {
            width: colValueWidth - rowPadding * 2,
          });
          // Add extra vertical padding for each row
          const extraPadding = 6;
          const rowHeight =
            Math.max(fieldHeight, valueHeight) + rowPadding * 2 + extraPadding;

          ensureSpace(rowHeight);

          const y = doc.y;
          doc.text(
            String(safeFieldName),
            left + rowPadding,
            y + rowPadding + extraPadding / 2,
            {
              width: colFieldWidth - rowPadding * 2,
            },
          );
          doc.text(
            String(displayValue),
            left + colFieldWidth + colGap + rowPadding,
            y + rowPadding + extraPadding / 2,
            {
              width: colValueWidth - rowPadding * 2,
              align: "right",
            },
          );
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
          const colWidths = Array.from(
            { length: columnCount },
            () => baseWidth,
          );
          colWidths[columnCount - 1] =
            usableWidth - baseWidth * (columnCount - 1);

          const cellHeights = cells.map((cell, index) =>
            doc.heightOfString(
              String(
                applyCurrency
                  ? formatValue(
                    cell !== undefined && cell !== null ? cell : "N/A",
                  )
                  : cell !== undefined && cell !== null
                    ? cell
                    : "N/A",
              ),
              {
                width: (colWidths[index] ?? baseWidth) - rowPadding * 2,
                align,
              },
            ),
          );
          // Add extra vertical padding for each grid row
          const extraPadding = 6;
          const rowHeight =
            Math.max(...cellHeights, 0) + rowPadding * 2 + extraPadding;

          ensureSpace(rowHeight);

          const y = doc.y;
          let x = left;
          cells.forEach((cell, index) => {
            const width = colWidths[index] ?? baseWidth;
            const safeCell = cell !== undefined && cell !== null ? cell : "N/A";
            doc.rect(x, y, width, rowHeight).stroke();
            doc.text(
              String(applyCurrency ? formatValue(safeCell) : safeCell),
              x + rowPadding,
              y + rowPadding + extraPadding / 2,
              {
                width: width - rowPadding * 2,
                align,
              },
            );
            x += width;
          });

          doc.y = y + rowHeight;
        };

        // Defensive: Ensure all normalRows are valid
        normalRows.forEach((row) => {
          const safeLabel =
            row.label !== undefined && row.label !== null ? row.label : "N/A";
          const safeValue =
            row.value !== undefined && row.value !== null ? row.value : "N/A";
          renderRow(safeLabel, safeValue);
        });

        tableGroups.forEach((group) => {
          const headers = group.columnOrder.length ? group.columnOrder : ["-"];

          const rowIndexes = Array.from(group.rowIndexes).sort((a, b) => a - b);

          if (rowIndexes.length === 0) return;

          const normalizeHeader = (header: string) =>
            header !== undefined && header !== null
              ? header.toLowerCase().replace(/\s+/g, " ").trim()
              : "-";
          const normalizedHeaders = headers.map(normalizeHeader);
          const isAustraliaTierTable =
            isAustralia &&
            normalizedHeaders.some((h) => h.includes("tier of intensity")) &&
            normalizedHeaders.some((h) => h.includes("notional")) &&
            normalizedHeaders.some((h) => h.includes("offset"));

          doc.moveDown(0.5);
          doc.fontSize(10);
          renderGridRow(
            headers.map((h) => (h !== undefined && h !== null ? h : "-")),
            "center",
            false,
          );
          rowIndexes.forEach((rowIndex) => {
            const rowValues = headers.map((header) => {
              const column = group.columns.get(
                header !== undefined && header !== null ? header : "-",
              );
              if (!column) return "N/A";
              const cellValue = column.has(rowIndex)
                ? column.get(rowIndex)
                : "N/A";
              return cellValue !== undefined && cellValue !== null
                ? cellValue
                : "N/A";
            });
            renderGridRow(rowValues, "right", true);
          });
        });

        // Add footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Generated on: ${new Date().toISOString()}`, {
          align: "center",
        });

        // Finalize the PDF
        doc.end();
      } catch (pdfError) {
        let errorMsg: string;
        if (pdfError instanceof Error) {
          errorMsg = pdfError.stack || pdfError.message;
        } else {
          errorMsg = String(pdfError);
        }
        throw new Error(`PDF content creation failed: ${errorMsg}`);
      }

      // Wait for PDF generation to complete and get buffer
      const pdfBuffer = await pdfBufferPromise;
      let blobName = `cases/${caseRid}/rdForms/${fileName}`;

      // Store PDF locally for testing
      // const fs = require('fs');
      // const path = require('path');
      // const localDir = path.resolve(__dirname, '../../../output/pdfs');
      // if (!fs.existsSync(localDir)) {
      //   fs.mkdirSync(localDir, { recursive: true });
      // }
      // const localPath = path.join(localDir, fileName);
      // fs.writeFileSync(localPath, pdfBuffer);
      // logMessage(`PDF stored locally for testing: ${localPath}`);

      // Upload directly to blob storage from buffer
      const blobUrl = await uploadBufferToAzureBlob(
        pdfBuffer,
        blobName,
        accountNumber,
      );
      return blobUrl;
    } catch (error) {
      this.logger.error("Error generating non-fillable PDF:", error);
      throw new Error(
        `Failed to generate non-fillable PDF: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Handle table configuration by resolving row-specific values
   * @param configItem - Table configuration item
   * @param enhancedConfigs - Array to store enhanced configurations
   * @param context - Context object containing account, case, and schema information
   */
  protected async handleTableConfig(
    configItem: any,
    enhancedConfigs: any[],
    context: {
      accountRid: string;
      caseRid: string;
      schemaName: string;
      stateRid?: string | null;
      fiscalYear?: string;
    },
  ) {

    if (configItem.column_id && configItem.calculation_config) {
      try {
        const operatorMap: Record<string, string> = {
          add: "+",
          sub: "-",
          subtract: "-",
          mul: "*",
          multiply: "*",
          div: "/",
          divide: "/",
        };

        // 🔹 Get column row mappings
        const columnIdList =
          await this.rdFormMapperSchemaService.getColumnIdListFromTableMappings(
            configItem.column_id,
          );

        let fieldMappings: Record<string, any> = {};

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
          this.logger.warn(
            `Error parsing column ID list: ${parseError}`,
          );
          fieldMappings = {};
        }

        if (Object.keys(fieldMappings).length === 0) {
          this.helper.pushEnhancedConfig(enhancedConfigs, configItem, "");
          return;
        }

        // 🔹 Prepare calculation keys
        const calculationKeys = Object.keys(configItem.calculation_config);

        const mapperObjects: Record<string, any> = {};
        const tableValueCache: Record<string, any[]> = {};

        // 🔹 Fetch all mapper objects + cache table values
        for (const key of calculationKeys) {
          const val = configItem.calculation_config[key];

          if (
            typeof val === "string" &&
            /^[UDSP]\d{3}-[0-9a-fA-F-]{36}$/.test(val)
          ) {
            const mapperObject =
              await this.rdFormMapperSchemaService.getDataMapperObjectByRid(
                val,
              );

            if (mapperObject?.ref_table && mapperObject?.field_name) {
              mapperObjects[val] = mapperObject;

              const tableValues =
                await this.rdFormMapperSchemaService.fetchTableValues(
                  mapperObject.ref_table,
                  mapperObject.field_name,
                  mapperObject.is_json || false,
                  mapperObject.data_order_by,
                  context.accountRid,
                  context.caseRid,
                  context.schemaName,
                  context.stateRid || "",
                  context.fiscalYear,
                  mapperObject.where_config ?? undefined,
                );

              tableValueCache[val] = tableValues || [];
            }
          }
        }

        // 🔹 Process each mapped row
        for (const [rowNumber, fieldPath] of Object.entries(fieldMappings)) {
          if (typeof fieldPath !== "string") continue;

          const rowIndex = parseInt(rowNumber, 10) - 1;

          // Build a per-row value lookup from all cached table values
          // Maps RID -> row value string for this specific row
          const rowValueMap: Record<string, string> = {};
          for (const [rid, rows] of Object.entries(tableValueCache)) {
            const rowEntry =
              (rows as any[]).find(
                (r: any) => Number(r.row_index) === rowIndex + 1,
              ) ?? (rows as any[])[rowIndex];
            const rv = rowEntry?.field_value ?? rowEntry?.value ?? null;
            rowValueMap[rid] =
              rv !== null && rv !== undefined ? String(rv) : "";
          }

          // Helper: resolve a #ref — first try per-row tableValueCache, then fall back
          // to field_id lookup in enhancedConfigs (for cross-field references like #f3_04[0])
          const resolveTableRef = (rawKey: string): string => {
            const key = rawKey
              .trim()
              .replace(/[\s,:{}<>]+$/, "")
              .trim();
            // Check per-row cache first (RID-based)
            for (const [rid, val] of Object.entries(rowValueMap)) {
              const mo = mapperObjects[rid];
              if (mo?.field_name === key || rid === key)
                return JSON.stringify(val);
            }
            // Fall back to field_id match in tableValueCache keys
            if (rowValueMap[key] !== undefined)
              return JSON.stringify(rowValueMap[key]);
            // Fall back to plain value (will be quoted for string safety)
            return JSON.stringify(key);
          };

          const tokens: string[] = [];
          let hasIfExpression = false;
          let ifExpressionValue = "";

          for (const key of calculationKeys) {
            const val = configItem.calculation_config[key];

            // IF expression — resolve inline using full expression pipeline
            if (typeof val === "string" && /\bIF\s*\(|#/.test(val)) {
              hasIfExpression = true;
              // Replace #field_id refs with per-row values from rowValueMap
              // Use the same field_id-based lookup: match against enhancedConfigs
              let resolved = val;

              // Replace #RID (exact UUID) with row value
              resolved = resolved.replace(
                /#([A-Za-z]\d{3}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g,
                (_m: string, rid: string) => {
                  const v = rowValueMap[rid];
                  if (v === undefined || v === "") return "null";
                  const n = Number(v);
                  return !isNaN(n) ? String(n) : JSON.stringify(v);
                },
              );

              // Replace #field_id / #label refs — allow spaces in labels (e.g. #Software Development)
              // Uses lookahead to stop at operators, comparisons, block delimiters, or next #
              resolved = resolved.replace(
                /#([^#+*/]+?)(?=\s*[+*\/:<>{}=!]|\s+-\s+(?=[#\d])|\s*,|\s*#|\s*\)|\s*$)/g,
                (_m: string, fieldRef: string) => {
                  const cleanRef = fieldRef
                    .trim()
                    .replace(/[\s,:{}<>]+$/, "")
                    .trim();

                  // 1. Look up by field_name in tableValueCache (same-table row-specific value)
                  const cachedByField = Object.entries(tableValueCache).find(
                    ([rid]) => {
                      return mapperObjects[rid]?.field_name === cleanRef;
                    },
                  );
                  if (cachedByField) {
                    const v = rowValueMap[cachedByField[0]];
                    if (v === undefined || v === "") return "null";
                    const n = Number(v);
                    return !isNaN(n) ? String(n) : JSON.stringify(v);
                  }

                  // 2. Look up by field_id or field_label in already-processed enhancedConfigs
                  //    (e.g. #line 1, #f3_04[0] — cross-field numeric/string references)
                  const cleanRefLower = cleanRef.toLowerCase();

                  // Find ALL matching configs for this ref (there may be multiple rows of a Table-Item)
                  const matchedConfigs = enhancedConfigs.filter(
                    (cfg: any) =>
                      (cfg.field_id && cfg.field_id === cleanRef) ||
                      (cfg.field_label &&
                        cfg.field_label.toLowerCase() === cleanRefLower) ||
                      (cfg.field_name &&
                        cfg.field_name.toLowerCase() === cleanRefLower),
                  );

                  if (matchedConfigs.length > 0) {
                    // If there are multiple matches, this is a Table-Item — get the row-specific one.
                    // Table-Item rows are stored with value_field_id = the PDF field path for that row,
                    // and the label is suffixed [row_N]. Try to find the matching row by row index.
                    const rowSpecific =
                      matchedConfigs.find((cfg: any) => {
                        // Match by row number suffix [row_N] on the label
                        const labelMatch = cfg.label?.match(/\[row_(\d+)\]$/);
                        return (
                          labelMatch &&
                          parseInt(labelMatch[1], 10) === rowIndex + 1
                        );
                      }) ?? matchedConfigs[0]; // fall back to first if no row suffix

                    const v =
                      rowSpecific.value !== undefined &&
                        rowSpecific.value !== null &&
                        rowSpecific.value !== ""
                        ? String(rowSpecific.value)
                        : null;
                    if (v === null) return "null";
                    const n = Number(v);
                    return !isNaN(n) ? String(n) : JSON.stringify(v);
                  }

                  // 3. No match found — treat as a plain string literal for comparison
                  //    (e.g. #Software Development in: IF(#f3_04 === #Software Development))
                  return JSON.stringify(cleanRef);
                },
              );

              resolved = this.helper.normalizeExpressionSyntax(resolved);
              resolved = this.helper.transformIfExpressions(resolved);

              try {
                // eslint-disable-next-line no-new-func
                const fn = new Function(
                  "Math",
                  `"use strict"; return (${resolved});`,
                );
                const result = fn(Math);
                if (result === null || result === undefined) {
                  ifExpressionValue = "";
                } else if (typeof result === "string") {
                  ifExpressionValue = result;
                } else if (!isNaN(Number(result))) {
                  ifExpressionValue = String(result);
                } else {
                  ifExpressionValue = "";
                }
              } catch (err) {
                this.logger.warn(
                  `IF expression evaluation error for row ${rowNumber}: ${err}`,
                );
                ifExpressionValue = "";
              }
              break; // IF expression is the whole value — no need to process other keys
            }

            // Operator
            else if (
              typeof val === "string" &&
              operatorMap[val.toLowerCase()]
            ) {
              const operator = operatorMap[val.toLowerCase()];
              if (operator) tokens.push(operator);
            }

            // RID reference
            else if (typeof val === "string" && mapperObjects[val]) {
              const rv = rowValueMap[val];
              if (rv === null || rv === undefined || rv === "") {
                tokens.push("0");
              } else {
                const numericValue = Number(rv);
                tokens.push(
                  !isNaN(numericValue)
                    ? String(numericValue)
                    : JSON.stringify(String(rv)),
                );
              }
            }

            // Numeric literal
            else if (typeof val === "number" || !isNaN(Number(val))) {
              tokens.push(String(Number(val)));
            }

            // Fallback
            else {
              tokens.push("0");
            }
          }

          let computedValue: any = "";

          let infixExpr = "";
          if (hasIfExpression) {
            computedValue = ifExpressionValue;
            infixExpr = "[IF expression]";
          } else {
            infixExpr = tokens.join(" ");
            try {
              // eslint-disable-next-line no-new-func
              const fn = new Function(
                "Math",
                `"use strict"; return (${infixExpr});`,
              );
              const rawValue = fn(Math);

              if (rawValue === null || rawValue === undefined) {
                computedValue = "";
              } else if (typeof rawValue === "string") {
                computedValue = rawValue;
              } else if (!isNaN(Number(rawValue))) {
                computedValue = Number(parseFloat(String(rawValue)).toFixed(2));
              } else {
                computedValue = "";
              }
            } catch (err) {
              const stripped = infixExpr.trim().replace(/^"|"$/g, "");
              computedValue = stripped || "";
            }
          }

          let finalValue = computedValue;
          // For Table-Item fields: if numeric result is 0, write empty string (PDF blank convention)
          if (finalValue === 0 || finalValue === "0") {
            finalValue = "";
          }
          // Truncate value if maxLength is set
          if (
            configItem.maxLength &&
            typeof finalValue === "string" &&
            finalValue.length > configItem.maxLength
          ) {
            finalValue = finalValue.substring(0, configItem.maxLength);
          }
          this.helper.pushEnhancedConfig(
            enhancedConfigs,
            configItem,
            finalValue,
            {
              label: `${configItem.field_label}[row_${rowNumber}]`,
              field_name: configItem.field_name,
              value_field_id: fieldPath,
            },
          );
        }

        return;
      } catch (error) {
        this.logger.error(
          `Error computing table config for ${configItem.field_label}:`,
          error,
        );
        this.helper.pushEnhancedConfig(enhancedConfigs, configItem, "");
        return;
      }
    }

    // 🔹 Default fallback
    this.helper.pushEnhancedConfig(
      enhancedConfigs,
      configItem,
      configItem.value,
    );
  }

  /**
   * Process RD form mapper requests and generate filled forms
   * @param message - Message containing case, account, and time period information
   * @returns Promise with status code, message, and form data
   */
  async processRdFormMapperRequests(message: any): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { task: any };
  }> {
    const parsedMessage =
      typeof message === "string" ? JSON.parse(message) : message;
    const {
      caseRid,
      accountRid,
      effectiveStart,
      effectiveEnd,
      accountNumber,
      schemaName,
      fiscalYear,
    } = parsedMessage;
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const [fetchAccountCountryId]: any[] = await mainDb.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
    );
    try {
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
      const executionConfigMap: Record<string, () => Promise<any>> = {
        [ConfigType.BOTH]: async () => {
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
            "",
            "",
          );
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
            "",
            "",
          );
          return federalResult;
        },
        [ConfigType.FEDERAL_ONLY]: async () => {
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
            "",
            "",
          );
        },
        [ConfigType.STATE_ONLY]: async () => {
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
            "",
            "",
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
      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing RD Mapper requests: ${errorMsg}`);
      await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        fetchAccountCountryId[0].country_rid,
        orgDb,
        accountNumber,
        "No valid RD form data available to process",
      );
      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage: errorMsg || "Failed to process RD form mapper requests",
        data: { task: null },
      };
      // return {
      //   statusCode: HttpStatus.FAILED,
      //   message: HttpStatus.FAILED_MESSAGE,
      //   errorMessage:"Failed to process RD form mapper requests",
      // };
    }
  }

  /**
   * Initiate the RD form filling process for a case
   * @param accountRid - Account RID
   * @param caseRid - Case RID
   * @param fiscalYear - Fiscal year to process
   * @returns Promise with status code, message, and form data
   */
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
        fiscalYear,
      };
      return await this.processRdFormMapperRequests(payload);
    } catch (error) {
      this.logger.error(`Error initiating RD Credit Process: ${error}`);

      return {
        statusCode: HttpStatus.FAILED,
        message: HttpStatus.FAILED_MESSAGE,
        errorMessage:
          STATUS_MESSAGE.rdCreditProcessInitiationFailed ||
          "Failed to initiate process",
      };
    }
  }

  /**
   * Retrieve RD form URL (filled form or error message)
   * @param value - Object containing account, case, fiscal year, form type, and country/state info
   * @returns Promise with status code, message, and form URL or error details
   */
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
          const sasUrl = await generateSasUrl(results.filled_form_url, 3000);
          results.filled_form_url = sasUrl
            ? await this.helper.fetchUrlAsBase64(sasUrl)
            : null;
        } catch (error) {
          this.logger.warn(`Error generating SAS URL: ${error}`);
          results.filled_form_url = null;
        }
      }

      return this.createSuccessResponse({
        rdformUrl: results?.filled_form_url || null,
        rdErrorMessage: results?.form_error_message || null,
      });
    } catch (error) {
      this.logger.error(`Error fetching RD Form URL: ${error}`);
      return this.createErrorResponse(
        STATUS_MESSAGE.jurisdictionFetchedFailed,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Creates a standardized success response
   * @param data - Data to include in the response
   * @returns Formatted success response object
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
   * @param errorMessage - Error message to include
   * @param details - Optional additional error details
   * @returns Formatted error response object
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
  /**
   * Sign off RD forms and create timeline entry
   * @param data - Sign-off data including case, account, user, and comments
   * @param file - Optional file attachment to upload
   * @returns Promise with status and message
   */
  async signOffRdForms(data: any, file: any) {
    const mainDb = await this.getMainDb();
    const orgDb = await this.getOrgDb();
    const parentAccount: any = await mainDb.query(
      await rawQueries.fetchParentAccount(data.account_rid, mainDb),
    );
    if (parentAccount[0].length > 0) {
      let schemaName = rawQueries.fetchSchemaName(parentAccount[0][0].r_number);
      const [caseDetails]: any = await orgDb.query(
        rawQueries.fetchCaseById(schemaName),
        { replacements: { caseId: data.case_rid }, type: QueryTypes.SELECT },
      );
      if (file !== undefined) {
        const fileUploadedResult = await uploadToAzureBlob(
          file,
          data.account_rid,
          "",
          parentAccount[0][0].r_number,
          "signoff",
        );
        await orgDb.query(
          rawQueries.insertDataIntoAttachments(
            schemaName,
            data.case_rid,
            data.userId,
            data.account_rid,
            fileUploadedResult.url,
            fileUploadedResult.name,
            caseDetails?.fiscal_year,
            fileUploadedResult.extension,
            fileUploadedResult.size,
            data.comments,
          ),
        );
      }
      const caseResult: any = await orgDb.query(
        rawQueries.updateRdFormSignOff(
          schemaName,
          data.case_rid,
          data.sign_off,
        ),
      );
      if (caseResult[1].rowCount) {
        const findRdFormSignOffId: any = await mainDb.query(
          rawQueries.getRdFormSignOffId(),
        );
        await orgDb.query(
          rawQueries.insertSignoffDetails(
            data.userId,
            findRdFormSignOffId[0][0].rid,
            data.case_rid,
            data.account_rid,
            schemaName,
            data.comments,
          ),
        );
        const userEventInfo: any =
          await this.helperMethod.fetchUserAndEventInfo({
            userId: data.userId!,
            eventType: eventTypes.UI_HANDLER,
          });
        const [caseDetails]: any[] = await orgDb.query(
          rawQueries.fetchCaseById(schemaName),
          { replacements: { caseId: data.case_rid }, type: QueryTypes.SELECT },
        );
        await this.helperMethod.createAccountTimelineEntry(
          parentAccount[0][0].r_number!,
          {
            created_by: data.userId!,
            account_rid: data.account_rid,
            entity_rid: data.case_rid!,
            entity_name: entityTypes.RD_FORM,
            created_by_name: userEventInfo.full_name,
            event_type_rid: userEventInfo.event_type_rid,
            event_name: eventNames.SIGNOFF,
            descriptions: caseDetails?.case_name || "",
            case_rid: data.case_rid,
          },
          ["case"],
        );
        return {
          statusCode: HttpStatus.SUCCESS,
          statusMessage: STATUS_MESSAGE.rdFormSignedOff,
        };
      } else {
        return {
          statusCode: HttpStatus.FAILED,
          statusMessage: STATUS_MESSAGE.rdFormSignOffFailed,
        };
      }
    } else {
      return {
        statusCode: HttpStatus.FAILED,
        statusMessage: STATUS_MESSAGE.accountNoFound,
      };
    }
  }
}