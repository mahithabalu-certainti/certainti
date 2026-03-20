import { QueryTypes, Sequelize } from "sequelize";
import {
  downloadBufferFromAzureBlob,
  logMessage,
  uploadBufferToAzureBlob,
} from "../../utils/helpers";
import {
  COUNTRY_CURRENCY_CODE,
  HttpStatus,
  rawQueries,
} from "../../utils/constants";
import {
  fetchProjectCostDetailsBasedOnCasesForRdforms,
  fetchTotalResourcesForCase,
} from "../../utils/rdFinancialWorkingQueries";
import axios from "axios";
import RdFormMapperSchemaService from "./schemaService";
import { Logger } from "winston";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";

/**
 * Stateless helper utilities for RD Form processing.
 * Extracted from RdFormMapperService to reduce file size and avoid circular dependencies.
 */
export class RdFormHelperService {
  private rdFormMapperSchemaService: RdFormMapperSchemaService;
  private logger: Logger;
  private orgDbSequelize: Sequelize | null = null;
  private mainDbSequelize: Sequelize | null = null;

  /**
   * Initialize RdFormHelperService with dependencies
   * @param rdFormMapperSchemaService - Schema service for database operations
   * @param logger - Winston logger instance
   */
  constructor(
    rdFormMapperSchemaService: RdFormMapperSchemaService,
    logger: Logger,
  ) {
    this.rdFormMapperSchemaService = rdFormMapperSchemaService;
    this.logger = logger;
  }

  /**
   * Gets or initializes the main database connection
   * @returns Promise<Sequelize> The main database instance
   */
  protected async getMainDb(): Promise<Sequelize> {
    if (!this.mainDbSequelize) {
      this.mainDbSequelize = await initMainDbSequelize();
    }
    return this.mainDbSequelize;
  }

  /**
   * Gets or initializes the organization database connection
   * @returns Promise<Sequelize> The organization database instance
   */
  protected async getOrgDb(): Promise<Sequelize> {
    if (!this.orgDbSequelize) {
      this.orgDbSequelize = await initOrgSequelize();
    }
    return this.orgDbSequelize;
  }
  /**
   * Round numeric value to two decimal places
   * @param value - Number to round
   * @returns Rounded value to 2 decimal places
   */
  roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Format number with locale-specific formatting
   * @param value - Value to format (number or string)
   * @returns Formatted number string or original value as string
   */
  formatNumber(value: any): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (typeof num === "number" && !isNaN(num)) {
      return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return String(value || "-");
  }

  /**
   * Parse a value to number, handling special cases
   * @param rawValue - Raw value to parse (string, number, or boolean-like)
   * @returns Parsed number or 0/null for invalid values
   */
  tryParseNumber(rawValue: any): number | null {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return 0;
    }
    let rawString = String(rawValue);
    if (
      (rawString.startsWith('"') && rawString.endsWith('"')) ||
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
    if (normalizedLower === "yes" || normalizedLower === "true") return 1;
    if (normalizedLower === "no" || normalizedLower === "false") return 0;

    if (normalized.startsWith("(") && normalized.endsWith(")")) {
      normalized = `-${normalized.slice(1, -1)}`;
    }

    let num = Number(normalized);
    if (Number.isFinite(num) && hasPercent) {
      num = num / 100;
    }
    return Number.isFinite(num) ? num : null;
  }

  /**
   * Remove array indexes from field references
   * @param fieldRef - Field reference with possible indexes
   * @returns Field reference without indexes
   */
  stripIndexes(fieldRef: string): string {
    return fieldRef.replace(/\[\d+\]/g, "");
  }

  /**
   * Normalize field reference for comparison
   * @param fieldRef - Field reference to normalize
   * @returns Normalized field reference
   */
  normalizeFieldRef(fieldRef: string): string {
    const trimmed = fieldRef.trim();
    const lastSegment = trimmed.split(".").pop() || trimmed;
    return lastSegment.replace(/\[\d+\]$/, "");
  }

  /**
   * Normalize expression syntax for evaluation
   * @param expression - Expression string to normalize
   * @returns Normalized expression
   */
  normalizeExpressionSyntax(expression: string): string {
    let result = expression;

    result = result.replace(/\s*-sub-\s*/gi, " - ");
    result = result.replace(/===/g, "==").replace(/!==/g, "!=");
    result = result.replace(/#YES\b/gi, "1").replace(/#NO\b/gi, "0");

    if (/\{\s*THEN\b/i.test(result)) {
      result = this.transformIfExpressions(result);
    }

    result = result.replace(
      /\b([A-Za-z]\d{3}-[0-9a-fA-F-]{36})\b/g,
      (match: string, _id: string, offset: number, full: string) =>
        offset > 0 && full[offset - 1] === "#" ? match : `#${match}`,
    );

    result = result.replace(
      /#([A-Za-z]\d{3}-[0-9a-fA-F-]{36})\s*([!=]=)\s*([\w'"-]+)/g,
      (_m: string, id: string, op: string, val: string) =>
        `String(#${id}) ${op} String(${val})`,
    );
    result = result.replace(
      /([\w'"-]+)\s*([!=]=)\s*#([A-Za-z]\d{3}-[0-9a-fA-F-]{36})/g,
      (_m: string, val: string, op: string, id: string) =>
        `String(${val}) ${op} String(#${id})`,
    );

    return result;
  }

  /**
   * Transform IF/THEN/ELSE expressions to JavaScript ternary operators
   * @param expression - Expression with IF/THEN/ELSE syntax
   * @returns Expression with JavaScript ternary operators
   */
  transformIfExpressions(expression: string): string {
    let result = expression;

    result = result.replace(
      /IF\s*\(([\s\S]*?)\)\s*\{\s*THEN\s*([\s\S]*?)\s*\}((?:\s*ELSE\s+IF\s*\([\s\S]*?\)\s*\{\s*THEN\s*[\s\S]*?\s*\})*)\s*(?:ELSE\s*\{\s*THEN\s*([\s\S]*?)\s*\})?/gi,
      (
        _match: string,
        cond1: string,
        then1: string,
        elseIfBlock: string,
        finalElse: string | undefined,
      ) => {
        const elseIfBranches: { cond: string; then: string }[] = [];
        const elseIfPattern =
          /ELSE\s+IF\s*\(([\s\S]*?)\)\s*\{\s*THEN\s*([\s\S]*?)\s*\}/gi;
        let m: RegExpExecArray | null;
        while ((m = elseIfPattern.exec(elseIfBlock)) !== null) {
          if (m[1] !== undefined && m[2] !== undefined) {
            elseIfBranches.push({ cond: m[1].trim(), then: m[2].trim() });
          }
        }
        let nested = finalElse !== undefined ? finalElse.trim() : '""';
        for (let i = elseIfBranches.length - 1; i >= 0; i--) {
          const branch = elseIfBranches[i];
          if (branch) {
            nested = `IF(${branch.cond}, ${branch.then}, ${nested})`;
          }
        }
        const safeCond = cond1 != null ? cond1.trim() : '';
        const safeThen = then1 != null ? then1.trim() : '""';
        return `IF(${safeCond}, ${safeThen}, ${nested})`;
      },
    );

    const ifRegex = /\bIF\s*\(/i;
    const splitTopLevel = (input: string): string[] => {
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
      if (buffer.length > 0) parts.push(buffer.trim());
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

  /**
   * Fetch a URL and convert to base64 string
   * @param url - URL to fetch
   * @returns Base64 encoded content as string
   */
  async fetchUrlAsBase64(url: string): Promise<string> {
    const REQUEST_TIMEOUT_MS = 30_000;
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
   * Format date string to MM/DD/YYYY format
   * @param dateStr - Date string in MM-DD-YYYY format
   * @returns Formatted date or original string if invalid
   */
  formatDate(dateStr: string): string {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return dateStr;
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  pushEnhancedConfig(
    enhancedConfigs: any[],
    configItem: any,
    value: any,
    overrides?: any,
  ): void {
    const cleanedFieldId =
      typeof configItem.field_id === "string"
        ? configItem.field_id.trim().replace(/\s+/g, "")
        : configItem.field_id;
    enhancedConfigs.push({
      ...configItem,
      label: configItem.field_label,
      value_field_id: configItem.field_id,
      value_field_id_cleaned: cleanedFieldId,
      value,
      ...overrides,
    });
  }

  /**
   * Renders UK form sections into a PDFKit document.
   */
  /**
   * Render UK form sections to PDF document
   * @param doc - PDFKit document object
   * @param ukFormData - Form data containing UK section information
   */
  renderUKSections(doc: any, ukFormData: any): void {
    const sections = [
      { key: "business_details", title: "Business Details" },
      { key: "contact_and_agent_details", title: "Contact and Agent Details" },
      { key: "accounting_period", title: "Accounting Period" },
      { key : "qualifying_expenditure_and_projects", title : "Qualifying expenditure and projects"},
      { key: "rd_scheme", title: "R&D Scheme" },
      {
        key: "rdec_qualifying_expenditure",
        title: "RDEC Qualifying Expenditure",
      },
      {
        key: "summary_rdec_qualifying_expenditure",
        title: "Summary of RDEC Qualifying Expenditure",
      },
      { key: "projects", title: "Projects" },
    ];

    sections.forEach((section) => {
      if (!ukFormData[section.key]) return;
      const left = doc.page.margins.left;
      if (section.key === "projects") {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(section.title, left, doc.y, { underline: true });
        doc.moveDown(0.5);
        this.renderProjectsTable(doc, ukFormData[section.key]);
      } else if (typeof ukFormData[section.key] === "string") {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(section.title + ":", { continued: true })
          .font("Helvetica")
          .text(" " + ukFormData[section.key]);
      } else {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(section.title, left, doc.y, { underline: true });
        doc.moveDown(0.5);
        this.renderSectionAsTable(doc, ukFormData[section.key]);
      }
      doc.moveDown(0.5);
    });
  }

  /**
   * Render fields within a section to PDF
   * @param doc - PDFKit document object
   * @param sectionData - Section data with fields to render
   */
  private renderSectionFields(doc: any, sectionData: any): void {
    const specialFields = [
      "Main Field Of Science Or Technology",
      "Existing Scientific Or Technological Knowledge It Planned To Improve",
      "Advancement In Knowledge It Aimed To Achieve",
      "Scientific Or Technological Uncertainties Faced",
      "How The Project Sought To Overcome Uncertainties",
    ];
    Object.keys(sectionData).forEach((key) => {
      const displayKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (specialFields.includes(displayKey)) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(displayKey + ":");
        doc.moveDown(0.5);
        const value = sectionData[key] || "";
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(value !== "-" ? value : " - ");
        doc.moveDown(0.5);
      } else {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(displayKey + ":", { continued: true })
          .font("Helvetica")
          .text(" " + (sectionData[key] || ""));
        doc.moveDown(0.5);
      }
    });
  }

  /**
   * Render projects as a table in PDF
   * @param doc - PDFKit document object
   * @param projects - Array of project data
   */
  private renderProjectsTable(doc: any, projects: any[]): void {
    projects.forEach((project: any, index: number) => {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`Project ${index + 1}:`, { underline: true });
      doc.moveDown(0.5);
      this.renderSectionFields(doc, project);
      doc.moveDown(0.5);
    });
  }

  /**
   * Render a section as a table in PDF
   * @param doc - PDFKit document object
   * @param sectionData - Section data to render as table
   */
  renderSectionAsTable(doc: any, sectionData: any): void {
    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const usableWidth = pageWidth - left - right;

    const colFieldWidth = Math.floor(usableWidth * 0.65);
    const colValueWidth = usableWidth - colFieldWidth;
    const rowPadding = 5;

    let currentY = doc.y;

    Object.keys(sectionData).forEach((key) => {
      const displayKey = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const value = sectionData[key] ?? "";

      const fieldHeight = doc.heightOfString(displayKey, {
        width: colFieldWidth - rowPadding * 2,
      });
      const valueHeight = doc.heightOfString(String(value), {
        width: colValueWidth - rowPadding * 2,
      });
      const rowHeight = Math.max(fieldHeight, valueHeight) + rowPadding * 2;

      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.y;
      }

      doc.rect(left, currentY, colFieldWidth, rowHeight).stroke();
      doc
        .rect(left + colFieldWidth, currentY, colValueWidth, rowHeight)
        .stroke();
      doc
        .moveTo(left + colFieldWidth, currentY)
        .lineTo(left + colFieldWidth, currentY + rowHeight)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .text(displayKey, left + rowPadding, currentY + rowPadding, {
          width: colFieldWidth - rowPadding * 2,
        });
      doc
        .font("Helvetica")
        .text(
          String(value),
          left + colFieldWidth + rowPadding,
          currentY + rowPadding,
          {
            width: colValueWidth - rowPadding * 2,
            align: "left",
          },
        );

      currentY += rowHeight;
    });

    doc
      .moveTo(left, currentY)
      .lineTo(pageWidth - right, currentY)
      .stroke();
    doc.y = currentY;
    doc.moveDown(0.5);
  }

  /**
   * Process UK form filling
   */
  async processUKForms(
    accountRid: string,
    caseRid: string,
    countryRid: string,
    accountNumber: string,
    mainDb: Sequelize,
    orgDb: Sequelize,
    schemaName: string,
    countryName: string,
  ): Promise<any> {
    logMessage("Country is UK. Generating dynamic UK PDF.");
    // Fetch extracted text from database or assume it's in computed_fields
    const [calcRow]: any[] = await orgDb.query(
      rawQueries.fetchCountryCalculationForCase(schemaName),
      { replacements: { caseRid }, type: QueryTypes.SELECT },
    );
    if (!calcRow) throw new Error("No calculation found for this case");
    const computedFields =
      typeof calcRow.computed_fields === "string"
        ? JSON.parse(calcRow.computed_fields)
        : calcRow.computed_fields;
    const [accountInfo]: any[] = await mainDb.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      { replacements: { accountRid }, type: QueryTypes.SELECT },
    );
    const [caseInfo]: any[] = await orgDb.query(
      rawQueries.fetchCaseById(schemaName),
      { replacements: { caseId: caseRid }, type: QueryTypes.SELECT },
    );
    const [accountDetails]: any[] = await orgDb.query(
      rawQueries.fetchAccountStartEndDate(accountRid, schemaName),
      { type: QueryTypes.SELECT },
    );

    const currencySymbol = await this.getCurrencySymbolByCountry(
      countryName,
      mainDb,
    );

    const projectInfo = await this.fetchProjectCostDetailsBasedOnCases(
      caseRid,
      accountRid,
      schemaName,
      orgDb,
    );
    const resoucesCount = await this.fetchTotalResourcesForCase(
      caseRid,
      accountRid,
      schemaName,
      orgDb,
    );
    const projectInfoWithExtras = projectInfo.map(
      ({ qre_final, ...p }: any) => ({
        ...p,
        "Project QRE": currencySymbol
          ? `${currencySymbol}${this.formatNumber(qre_final || "-")}`
          : this.formatNumber(qre_final || "-"),
        "Main field of science or technology": "-",
        "Existing scientific or technological knowledge it planned to improve":
          "-",
        "Advancement in knowledge it aimed to achieve": "-",
        "Scientific or Technological Uncertainties Faced": "-",
        "How the project sought to overcome uncertainties": "-",
      }),
    );

    const fiscalYear = parseInt(caseInfo.fiscal_year);
    const startDate = `${accountDetails.fiscal_start_date}/${fiscalYear - 1}`;
    const endDate = `${accountDetails.fiscal_end_date}/${fiscalYear}`;
    const accountingPeriodFormatted = `${this.formatDate(startDate)} to ${this.formatDate(endDate)}`;
    const accountPeriodEnd = `Accounting period ending ${this.formatDate(endDate)} part of long period of account`
    const roleInCompany = `Role in relation to ${accountInfo.account_name}`
    const noOfEpws = `Number of EPW's`
    const externally_provided_workers = 'Externally provided workers (EPW)'

    let ukFormData = {
      business_details: {
        business_name: accountInfo.account_name || "",
        corporation_tax_unique_taxpayer_reference: "",
        correct_corporation_tax_reference_for_the_business: "-",
        has_PAYE_reference: "-",
        employer_PAYE_reference: "-",
        has_VAT_number: "-",
        VAT_number: "-",
        type_of_business: "-",
      },
      contact_and_agent_details: {
        your_full_name: "-",
        you_are_the_senior_officer_responsible_for_this_claim: "-",
        [roleInCompany]: "-",
        email_address_to_send_confirmation_to: "-",
        confirmation_email_address :"-",
        telephone_number: "-",
        has_tax_agent_for_rd_claim: "-",
      },
      accounting_period: {
        start_date_of_accounting_period : this.formatDate(startDate),
        end_date_of_accounting : this.formatDate(endDate),
        [accountPeriodEnd] : '-'
      },
      qualifying_expenditure_and_projects: {
        schemes: "RDEC",
      },
      rdec_qualifying_expenditure: {
        staffing_costs: currencySymbol
          ? `${currencySymbol}${this.formatNumber(computedFields.Total?.Employees)}`
          : this.formatNumber(computedFields.Total?.Employees),
        [externally_provided_workers]: currencySymbol
          ? `${currencySymbol}${this.formatNumber(computedFields.Total?.["Net EPW"] || "-")}`
          : this.formatNumber(computedFields.Total?.["Net EPW"] || "-"),
        [noOfEpws]: resoucesCount || "-",
        software: currencySymbol
          ? `${currencySymbol}${this.formatNumber(caseInfo.material_software_cost)}`
          : this.formatNumber(caseInfo.material_software_cost),
        consumable_items: currencySymbol
          ? `${currencySymbol}${this.formatNumber(caseInfo.heat_light_power)}`
          : this.formatNumber(caseInfo.heat_light_power),
      },
      summary_rdec_qualifying_expenditure: {
        [`Accounting period ${accountingPeriodFormatted}`]: currencySymbol
          ? `${currencySymbol}${this.formatNumber(computedFields["Percentage Calculation"]?.["Total QRE"] || "-")}`
          : this.formatNumber(
              computedFields["Percentage Calculation"]?.["Total QRE"] || "-",
            ),
        qualifying_indirect_activities: "-",
      },
      projects: projectInfoWithExtras,
    };
    const filledFormUrl = await this.generateUKCreditPdf(
      ukFormData,
      caseRid,
      accountNumber,
    );
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
      data: filledFormUrl,
    };
  }

  private async fetchProjectCostDetailsBasedOnCases(
    caseRid: string,
    accountRid: string,
    schemaName: string,
    orgDb: Sequelize,
  ) {
    const query = await fetchProjectCostDetailsBasedOnCasesForRdforms(
      caseRid,
      accountRid,
      schemaName,
    );
    const [result]: any[] = await orgDb.query(query, {
      type: QueryTypes.SELECT,
    });
    return result?.projects || [];
  }

  private async fetchTotalResourcesForCase(
    caseRid: string,
    accountRid: string,
    schemaName: string,
    orgDb: Sequelize,
  ) {
    const query = await fetchTotalResourcesForCase(
      caseRid,
      accountRid,
      schemaName,
    );
    const [result]: any[] = await orgDb.query(query, {
      type: QueryTypes.SELECT,
    });
    return result?.total_resources || 0;
  }
  /**
   * Generate UK Credit PDF from structured form data
   */
  async generateUKCreditPdf(
    ukFormData: any,
    caseRid: string,
    accountNumber: string,
  ): Promise<string> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("UK R&D Credit Summary", { align: "center" });
    doc.moveDown(1);

    // Render sections
    this.renderUKSections(doc, ukFormData);

    // Set up event listeners before ending the document
    const buffers: Buffer[] = [];
    doc.on("data", (d: Buffer) => buffers.push(d));

    return new Promise<string>((resolve, reject) => {
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);

        // const fs = require('fs');
        // const path = require('path');
        // const localDir = path.resolve(__dirname, '../../../output/pdfs');
        // if (!fs.existsSync(localDir)) {
        //   fs.mkdirSync(localDir, { recursive: true });
        // }
        // const localPath = path.join(localDir, `uk_credit_${caseRid}_${Date.now()}.pdf`);
        // fs.writeFileSync(localPath, pdfBuffer);
        // logMessage(`UK PDF stored locally for testing: ${localPath}`);

        const blobName = `cases/${caseRid}/rdForms/uk_credit_${caseRid}_${Date.now()}.pdf`;
        try {
          const blobUrl = await uploadBufferToAzureBlob(
            pdfBuffer,
            blobName,
            accountNumber,
          );
          logMessage(`UK PDF uploaded to blob: ${blobUrl}`);
          resolve(blobUrl);
        } catch (error) {
          this.logger.error(`Error uploading UK PDF to blob: ${error}`);
          reject(error);
        }
      });
      doc.on("error", reject);
      doc.end();
    });
  }

  async getCurrencySymbolByCountry(
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
  // ─────────────────────────────────────────────────────────────────────────
  // T661 — Canada SR&ED Expenditures Claim
  // Static sections: Part 1 (claimant), Part 3 (totals), Part 4 (calculation),
  //                  Part 5 (certification)
  // Dynamic section: Part 2 — one page per project
  // ─────────────────────────────────────────────────────────────────────────
  async generateT661Pdf(
    caseRid: string,
    schemaName: string,
    accountNumber: string,
    templateBlobUrl: string,
  ): Promise<string> {
    // ── PDF Annotation approach ────────────────────────────────────────────
    // Overlays data onto the official blank CRA T661 form template using
    // pdf-lib annotations. The blank template must exist at:
    //   src/modules/rdForm/templates/canadaform.pdf
    //
    // Field layout coordinates were extracted from the blank T661 PDF
    // (canadaform.pdf) using structure analysis. Each annotation maps to
    // the exact field entry box on the form.
    // ──────────────────────────────────────────────────────────────────────
    const fs = require("fs");
    const path = require("path");
    const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

    const orgDb = await this.getOrgDb();
    const mainDb = await this.getMainDb();

    // ── 1. Fetch case + computed fields ───────────────────────────────────
    const [caseRow]: any[] = await orgDb.query(
      rawQueries.fetchCaseInfo(schemaName, caseRid),
      { replacements: { caseRid }, type: QueryTypes.SELECT },
    );
    if (!caseRow) throw new Error("Case not found");

    const [calcRow]: any[] = await orgDb.query(
      rawQueries.fetchCountryCalculationForCase(schemaName),
      { replacements: { caseRid }, type: QueryTypes.SELECT },
    );
    if (!calcRow) throw new Error("No calculation found for this case");

    const computedFields =
      typeof calcRow.computed_fields === "string"
        ? JSON.parse(calcRow.computed_fields)
        : calcRow.computed_fields;
    if (!computedFields) throw new Error("No computed_fields found");

    const inputParams =
      typeof calcRow.input_params === "string"
        ? JSON.parse(calcRow.input_params)
        : calcRow.input_params;

    // DB shape: { computedFields: { Total, Projects, Title }, finalCredit }
    const inner = computedFields?.computedFields ?? computedFields;
    const totals = inner?.Total ?? {};
    const projects = (inner?.Projects ?? []) as any[];
    const titleObj = inner?.Title ?? {};
    const finalCredit = (computedFields?.finalCredit ??
      inner?.finalCredit ??
      0) as number;
    const p1 = computedFields?.Part1 ?? {}; // legacy

    const fiscalYearStr = String(
      titleObj["Fiscal Year"] || inputParams?.fiscal_year || "",
    );
    const fyMatch = fiscalYearStr.match(/(\d{4})[-\/](\d{4})/);
    const taxYearFrom =
      inputParams?.fiscal_year_start || (fyMatch ? fyMatch[1] : fiscalYearStr);
    const taxYearTo =
      inputParams?.fiscal_year || (fyMatch ? fyMatch[2] : fiscalYearStr);

    // Dummy SR&ED project data for any missing text fields

    const fmt = (v: any): string => {
      if (v === null || v === undefined || v === "") return "";
      const n = Number(v);
      if (!isNaN(n) && String(v).trim() !== "") {
        return n.toLocaleString("en-CA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      }
      return String(v);
    };

    // ── 2. Load blank template ─────────────────────────────────────────────
    const parsedTemplateUrl = new URL(templateBlobUrl);
    const [templateContainer] = parsedTemplateUrl.pathname
      .split("/")
      .filter(Boolean);
    if (!templateContainer)
      throw new Error(
        "Invalid T661 template blob URL: container name not found",
      );

    const templateBlobName = decodeURIComponent(
      parsedTemplateUrl.pathname.split("/").slice(2).join("/"),
    );
    logMessage(
      `Downloading T661 template from container: ${templateContainer}, blob: ${templateBlobName}`,
    );
    const pdfBytes = await downloadBufferFromAzureBlob(
      templateContainer,
      templateBlobName,
    );
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Helper: draw text at PDF coords (y from bottom, x from left)
    // PDF is 612 x 792. Our coords are "top from top", so y_pdf = 792 - top - height
    const draw = (
      pageIndex: number,
      text: string,
      x: number,
      topFromTop: number,
      fontSize = 8,
      maxWidth = 500,
    ) => {
      if (!text || text.trim() === "") return;
      const page = pages[pageIndex];
      const y = 792 - topFromTop - fontSize;
      // Truncate text to maxWidth
      let t = text;
      while (
        t.length > 0 &&
        helvetica.widthOfTextAtSize(t, fontSize) > maxWidth
      ) {
        t = t.slice(0, -1);
      }
      page.drawText(t, {
        x,
        y,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
    };

    // Helper: multiline text in a box
    const drawBox = (
      pageIndex: number,
      text: string,
      x: number,
      topFromTop: number,
      boxHeight: number,
      fontSize = 6,
      lineSpacing = 1.3,
    ) => {
      if (!text || text.trim() === "") return;
      const page = pages[pageIndex];
      const maxWidth = 580 - x;
      const lineH = fontSize * lineSpacing;
      const words = text.split(/\s+/);
      let line = "";
      let yOffset = topFromTop + fontSize;

      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (helvetica.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
          page.drawText(line, {
            x,
            y: 792 - yOffset,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          yOffset += lineH;
          if (yOffset - topFromTop > boxHeight) break;
          line = word;
        } else {
          // Handle newlines in text
          if (word.includes("\n")) {
            const parts = word.split("\n");
            line = (line ? line + " " : "") + parts[0];
            page.drawText(line, {
              x,
              y: 792 - yOffset,
              size: fontSize,
              font: helvetica,
              color: rgb(0, 0, 0),
            });
            for (let i = 1; i < parts.length; i++) {
              yOffset += lineH;
              if (yOffset - topFromTop > boxHeight) return;
              if (parts[i]) {
                page.drawText(parts[i], {
                  x,
                  y: 792 - yOffset,
                  size: fontSize,
                  font: helvetica,
                  color: rgb(0, 0, 0),
                });
              }
            }
            line = parts[parts.length - 1] || "";
          } else {
            line = test;
          }
        }
      }
      if (line) {
        page.drawText(line, {
          x,
          y: 792 - yOffset,
          size: fontSize,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
      }
    };

    // ── 3. PAGE 1 — Part 1 General information ────────────────────────────
    const corpName = caseRow.client_name || "";
    const totalProj = String(projects.length || "");

    draw(0, corpName, 23, 345, 9, 270); // 010 name of claimant
    draw(0, taxYearFrom, 68, 421, 8, 55); // from year
    draw(0, taxYearTo, 195, 421, 8, 55); // to year
    draw(0, totalProj, 214, 437, 8, 30); // 050 total projects

    // ── 4. PAGE 4 — Part 3 SR&ED Expenditures ─────────────────────────────
    draw(3, "X", 51, 103, 8); // 160 proxy method elected

    draw(3, fmt(totals["FTE QRE"] ?? ""), 525, 192, 8); // 300 employees other than specified
    draw(3, fmt(totals["FTE QRE"] ?? ""), 525, 222, 8); // 306 subtotal salaries
    draw(3, fmt(totals["Subcon QRE"] ?? ""), 525, 334, 8); // 340 arm-length contracts
    // draw(3, '0',                              525, 374, 8); // 360 overhead = 0
    draw(3, fmt(totals["FTE QRE"] + (totals["Subcon QRE"] ?? 0)), 525, 386, 8); // 380 total allowable
    draw(3, fmt(totals["FTE QRE"] + (totals["Subcon QRE"] ?? 0)), 525, 460, 8); // 420 = line 380
    draw(3, fmt(totals["FTE QRE"] + (totals["Subcon QRE"] ?? 0)), 525, 558, 8); // 442 subtotal
    draw(3, fmt(totals["FTE QRE"] + (totals["Subcon QRE"] ?? 0)), 525, 639, 8); // 455 amount available
    draw(3, fmt(totals["FTE QRE"] + (totals["Subcon QRE"] ?? 0)), 525, 659, 8); // 460 deduction claimed
    draw(3, "0", 525, 694, 8); // 470 carry-forward

    // ── 5. PAGE 5 — Part 4 Qualified expenditures ─────────────────────────
    draw(4, fmt(totals["QRE"] ?? ""), 525, 73, 8); // 492 total allowable
    draw(4, fmt(totals["FTE Proxy (55%)"] ?? ""), 525, 116, 8); // 502 prescribed proxy
    draw(4, fmt(totals["QRE"] ?? ""), 525, 147, 8); // 511 subtotal
    draw(4, fmt(totals["Contractors Amt (20%)"] ?? ""), 525, 249, 8); // 529 20% subcon
    draw(4, fmt(totals["QRE"] ?? ""), 525, 367, 8); // 559 qualified
    draw(4, fmt(totals["QRE"] ?? ""), 525, 411, 8); // 570 total qualified

    // ── 6. PAGE 6 — Part 5 PPA + Part 6 Project Costs ─────────────────────
    draw(5, fmt(totals["FTE QRE"] ?? ""), 525, 108, 8); // 810 salary base
    draw(5, fmt(totals["FTE QRE"] ?? ""), 525, 157, 8); // 814 subtotal salary base
    draw(5, fmt(totals["FTE QRE"] ?? ""), 525, 421, 8); // 818 salary base total
    draw(5, fmt(totals["FTE Proxy (55%)"] ?? ""), 525, 464, 8); // 820 PPA 55%

    const rowTops: number[] = [627, 647, 668, 689, 710];
    projects.slice(0, 5).forEach((proj: any, idx: number) => {
      const top: number = rowTops[idx] ?? 0;
      draw(
        5,
        String(proj["Project Code"] || proj["Project Name"] || ""),
        49,
        top,
        7,
        150,
      );
      draw(5, fmt(proj["FTE QRE"] ?? ""), 217, top, 7, 90);
      draw(5, fmt(proj["Subcon QRE"] ?? ""), 395, top, 7, 90);
    });
    draw(5, fmt(totals["FTE QRE"] ?? ""), 217, 735, 7, 90); // totals row salary
    draw(5, fmt(totals["Subcon QRE"] ?? ""), 395, 735, 7, 90); // totals row contract

    // ── 7. PAGE 7 — Part 7 Additional information ─────────────────────────
    draw(6, fmt(totals["FTE QRE"] ?? ""), 525, 54, 8); // 605 SR&ED salaries in Canada
    /* draw(6, 'X', 51, 270, 8); // 622 Experimental development
    [410, 426, 442, 458, 476, 514, 530, 546, 562].forEach(top => draw(6, 'X', 545, top, 8));

    // ── 8. PAGE 8 — Part 9 Claim preparer ─────────────────────────────────
    draw(7, 'X', 61, 134, 8);
    draw(7, 'Certainti.ai',         23,  310, 8, 170);
    draw(7, '30-1409524',           197, 310, 8, 68);
    draw(7, '1',                    270, 310, 8, 50);
    draw(7, fmt(finalCredit ?? ''), 527, 310, 8, 60);
    draw(7, fmt(finalCredit ?? ''), 527, 433, 8, 60);*/

    // ── 9. PAGE 9 — Part 10 Certification ─────────────────────────────────
    draw(8, corpName, 43, 90, 8);
    draw(8, new Date().toISOString().slice(0, 10), 475, 90, 8);
    draw(8, "Certainti.ai", 43, 133, 8);

    // ── 10. Dynamic Part 2 — one CLEAN page per project ──────────────────
    //
    // KEY POINT: Part 2 is dynamic — one full copy of pages 2+3 per project.
    //
    // Problem with naive copyPages(pdfDoc, [1]):
    //   After project-1 text is drawn onto pdfDoc's page index 1, any
    //   subsequent copyPages call from pdfDoc gives a page that ALREADY
    //   contains project-1's annotations.  Project-2's text then draws
    //   on top → overlap / corruption.
    //
    // Solution: For each project, reload the original blank template bytes
    //   (pdfBytes, read once at the top of this method) into a fresh
    //   PDFDocument, annotate its pages 1+2 (form pages 2+3) with that
    //   project's data, then copy those two clean annotated pages into the
    //   final assembled document.
    //
    // Final page order:
    //   [0]        Part 1  (already annotated in pdfDoc)
    //   [1..2]     Project-1  Part 2 Sec A+B / Sec C
    //   [3..4]     Project-2  Part 2 Sec A+B / Sec C   (if exists)
    //   ...
    //   [n..n+5]   Parts 3-10 (pages 3-8 of pdfDoc, already annotated)

    // Helper — annotate blank-doc pages for one project and return the two
    // finished PDFPage objects (already copied into pdfDoc ready to insert).
    const buildProjectPages = async (proj: any): Promise<any> => {
      // Fresh blank doc from original bytes — completely empty
      const blankDoc = await PDFDocument.load(pdfBytes);
      const blankFont = await blankDoc.embedFont(StandardFonts.Helvetica);
      const bp = blankDoc.getPages(); // bp[1] = Part2 SecA+B, bp[2] = Part2 SecC

      // --- local draw helpers that write into blankDoc ---
      const bd = (
        pageIdx: number,
        text: string,
        x: number,
        topFromTop: number,
        fontSize = 8,
        maxWidth = 500,
      ) => {
        if (!text?.trim()) return;
        const page = bp[pageIdx];
        const y = 792 - topFromTop - fontSize;
        let t = text;
        while (
          t.length > 1 &&
          blankFont.widthOfTextAtSize(t, fontSize) > maxWidth
        )
          t = t.slice(0, -1);
        page.drawText(t, {
          x,
          y,
          size: fontSize,
          font: blankFont,
          color: rgb(0, 0, 0),
        });
      };

      const bdBox = (
        pageIdx: number,
        text: string,
        x: number,
        topFromTop: number,
        boxHeight: number,
        fontSize = 6,
        lineSpacing = 1.3,
      ) => {
        if (!text?.trim()) return;
        const page = bp[pageIdx];
        const maxWidth = 580 - x;
        const lineH = fontSize * lineSpacing;
        const words = text.split(/\s+/);
        let line = "";
        let yOffset = topFromTop + fontSize;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (blankFont.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
            page.drawText(line, {
              x,
              y: 792 - yOffset,
              size: fontSize,
              font: blankFont,
              color: rgb(0, 0, 0),
            });
            yOffset += lineH;
            if (yOffset - topFromTop > boxHeight) break;
            line = word;
          } else {
            line = test;
          }
        }
        if (line && yOffset - topFromTop <= boxHeight)
          page.drawText(line, {
            x,
            y: 792 - yOffset,
            size: fontSize,
            font: blankFont,
            color: rgb(0, 0, 0),
          });
      };
      // ---------------------------------------------------------

      // ── Page 1 of blank (form page 2) — Sec A + Sec B ────────
      // Coordinates verified against actual PDF rendering (no overlaps)
      const pName = String(
        proj["Project Name"] || proj["Project Code"] || "SR&ED Project",
      );
      const pStart = String(proj["Start Year"] || taxYearFrom);
      const pEnd = String(proj["End Year"] || taxYearTo);
      const pStartM = String(proj["Start Month"] || "");
      const pEndM = String(proj["End Month"] || "");
      const fos = String(proj["Field of Science"] || "2.02.09");
      const isCont = Boolean(proj["Continuation"]);

      bd(1, pName, 23, 86, 8, 560); // 200 title (below label top=74)
      bd(1, pStart, 30, 149, 8, 52); // 202 start year (below Year header top=137)
      bd(1, pStartM, 87, 149, 8, 35); // 202 start month
      bd(1, pEnd, 217, 149, 8, 52); // 204 end year
      bd(1, pEndM, 272, 149, 8, 35); // 204 end month
      bd(1, fos, 391, 130, 7, 190); // 206 field of science (below sub-label top=118)
      bd(1, isCont ? "X" : "", 44, 163, 8, 14); // 208 continuation checkbox
      bd(1, isCont ? "" : "X", 284, 163, 8, 14); // 210 first claim checkbox
      bd(1, "X", 548, 185, 8, 14); // 218 No — not joint work

      // Section B — text stamped line-by-line onto ruled lines
      // Ruled line tops from pdfplumber (top-origin). Text placed just ABOVE each line.
      // LINES_xxx[0] = label/question row → skip it; use [1:] for entry rows.
      const LINES_242 = [316.2, 329.7, 344.1, 358.5, 372.9, 387.6];
      const LINES_244 = [
        405.8, 420.0, 434.4, 448.8, 463.2, 477.6, 492.0, 506.4, 520.8, 535.2,
        549.6, 564.0, 578.4, 592.8, 607.2, 621.6, 640.3,
      ];
      const LINES_246 = [640.3, 658.6, 672.7, 687.1, 701.5, 715.9];

      const stampLines = (lineList: number[], text: string, fontSize = 7) => {
        if (!text?.trim()) return;
        const entryLines = lineList.slice(1); // skip first (label row)
        const charsPerLine = Math.floor(560 / (fontSize * 0.52));
        const wrapped: string[] = [];
        for (const para of text.split("\n")) {
          const words = para.split(" ");
          let line = "";
          for (const word of words) {
            const test = line ? line + " " + word : word;
            if (test.length > charsPerLine && line) {
              wrapped.push(line);
              line = word;
            } else line = test;
          }
          if (line) wrapped.push(line);
        }
        wrapped.forEach((line, i) => {
          if (i >= entryLines.length) return;
          const lineValue = entryLines[i];
          if (lineValue === undefined) return;
          const textTop = lineValue - fontSize - 1; // just above the ruled line
          bd(1, line, 23, textTop, fontSize, 560);
        });
      };

      let uncertainty = String(proj["Uncertainty"] || proj["242"] || "");
      const workPerformed = String(proj["Work Performed"] || proj["244"] || "");
      const advancements = String(proj["Advancements"] || proj["246"] || "");

      stampLines(LINES_242, uncertainty);
      stampLines(LINES_244, workPerformed);
      stampLines(LINES_246, advancements);

      // ── Page 2 of blank (form page 3) — Sec C ─────────────────
      // Coords verified: ruled lines at 131.3 (257 row), 155.4 (name/firm entry),
      //   183.6 (personnel row 1), 201.6 (row 2), 219.6 (row 3)
      /* const prepName = String(proj['PreparedByName'] || 'Certainti.ai');
      const prepFirm = String(proj['PreparedByFirm'] || 'Certainti.ai');
      const personnel: any[] = proj['KeyPersonnel'] || [];

      // 257 External consultant checkbox (label top=141) + name/firm on entry line (top=144)
      bd(2, 'X',        44,  141, 8, 14);  // 257 checkbox
      bd(2, prepName,   235, 144, 8, 200); // 258 name (entry below ruled line 131.3)
      bd(2, prepFirm,   467, 144, 8, 118); // 259 firm

      // Key personnel: entry rows at 183, 201, 219 (ruled lines at 183.6, 201.6, 219.6)
      const personnelTops = [183, 201, 219];
      personnel.slice(0, 3).forEach((p: any, idx: number) => {
        const top = personnelTops[idx] || 0;
        bd(2, String(p.name  || ''), 35,  top, 8, 260);
        bd(2, String(p.quals || ''), 309, top, 8, 270);
      });

      // 265 No / 266 No / 267 Yes — label tops: 244.6 / 259.3 / ~274
      bd(2, 'X', 557, 245, 8, 14);  // 265 No
      bd(2, 'X', 557, 260, 8, 14);  // 266 No
      bd(2, 'X', 522, 275, 8, 14);  // 267 Yes

      // Evidence checkboxes — positions measured from pdfplumber word coordinates
      const evidence: string[] = proj['Evidence'] || ['270','274','276','280','281'];
      const evidencePos: Record<string, [number, number]> = {
        '270': [44,  370], '271': [44,  383], '272': [44,  396],
        '273': [44,  409], '274': [44,  424], '275': [44,  437],
        '276': [331, 370], '277': [331, 383], '278': [331, 396],
        '279': [331, 409], '280': [331, 424], '281': [331, 437],
      };
      evidence.forEach(code => {
        const pos = evidencePos[code];
        if (pos) bd(2, 'X', pos[0], pos[1], 8);
      });
      if (proj['EvidenceOther'])
        bd(2, String(proj['EvidenceOther']), 365, 443, 8, 220);
*/
      // Return the annotated blankDoc itself — pages will be copied into
      // finalDoc at assembly time using finalDoc.copyPages(blankDoc, [1, 2])
      return blankDoc;
    };

    // ── Assemble final document ────────────────────────────────────────────
    // Build a brand-new PDFDocument with pages in correct order:
    //   Part 1  →  [Project-1 p2+p3]  →  [Project-2 p2+p3]  →  Parts 3-10
    const finalDoc = await PDFDocument.create();

    // Part 1 (index 0 of pdfDoc — already annotated)
    const [part1Page] = await finalDoc.copyPages(pdfDoc, [0]);
    finalDoc.addPage(part1Page);

    // One Part-2 spread (2 pages) per project — copy from each project's own blankDoc
    for (const proj of projects) {
      const blankDoc = await buildProjectPages(proj);
      const [secAB, secC] = await finalDoc.copyPages(blankDoc, [1, 2]);
      finalDoc.addPage(secAB);
      finalDoc.addPage(secC);
    }

    // Parts 3-10 (indices 3-8 of pdfDoc — already annotated)
    const staticPages = await finalDoc.copyPages(pdfDoc, [3, 4, 5, 6, 7, 8]);
    staticPages.forEach((p: any) => finalDoc.addPage(p));

    // ── 11. Serialize and upload ───────────────────────────────────────────
    const filledBytes = await finalDoc.save();
    const pdfBuf = Buffer.from(filledBytes);
    const localDir = path.resolve(__dirname, "../../../output/pdfs");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(
      localDir,
      `ireland_credit_${caseRid}_${Date.now()}.pdf`,
    );
    fs.writeFileSync(localPath, pdfBuf);
    logMessage(`Ireland PDF stored locally for testing: ${localPath}`);

    const blobName = `cases/${caseRid}/rdForms/t661_${caseRid}_${Date.now()}.pdf`;
    const blobUrl = await uploadBufferToAzureBlob(
      pdfBuf,
      blobName,
      accountNumber,
    );
    logMessage(
      `[T661] PDF generated (${projects.length} project pages): ${blobUrl}`,
    );
    return blobUrl;
  }

  async generateIrelandCreditPdf(
    caseRid: string,
    schemaName: string,
    accountNumber: string,
  ): Promise<string> {
    const orgDb = await this.getOrgDb();
    const mainDb = await this.getMainDb();
    const currencySymbol = await this.getCurrencySymbolByCountry(
      "Ireland",
      mainDb,
    );
    const [caseRow]: any[] = await orgDb.query(
      rawQueries.fetchCaseInfo(schemaName, caseRid),
      { replacements: { caseRid }, type: QueryTypes.SELECT },
    );
    if (!caseRow) throw new Error("Case not found");
    const [calcRow]: any[] = await orgDb.query(
      rawQueries.fetchCountryCalculationForCase(schemaName),
      { replacements: { caseRid }, type: QueryTypes.SELECT },
    );
    if (!calcRow) throw new Error("No calculation found for this case");

    const inputParams =
      typeof calcRow.input_params === "string"
        ? JSON.parse(calcRow.input_params)
        : calcRow.input_params;
    if (!inputParams || inputParams.country !== "IRL")
      throw new Error("Country is not Ireland (IRL)");

    const computedFields =
      typeof calcRow.computed_fields === "string"
        ? JSON.parse(calcRow.computed_fields)
        : calcRow.computed_fields;
    if (!computedFields) throw new Error("No computed_fields found");

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    const titleFields = computedFields.Title || {};
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Ireland R&D Credit Summary", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica");
    // Print only Account Name and Fiscal Year (Expleo)
    if (titleFields["Account Name"]) {
      doc
        .font("Helvetica-Bold")
        .text("Account Name:", { continued: true })
        .font("Helvetica")
        .text(" " + titleFields["Account Name"]);
    }
    if (titleFields["Expleo"]) {
      doc
        .font("Helvetica-Bold")
        .text("Fiscal Year:", { continued: true })
        .font("Helvetica")
        .text(" " + titleFields["Expleo"]);
    }
    doc.moveDown(1);

    const columns: string[] = computedFields.Columns || [];
    const projects: any[] = computedFields.Projects || [];
    const total: Record<string, any> = computedFields.Total || {};
    const boldFields: string[] = computedFields.BOLD || [];
    if (!columns.length) throw new Error("No columns found in computed_fields");

    // Helper to render a table for a given set of projects
    const ROW_PADDING = 5;
    const FONT_SIZE = 9;
    const HEADER_FONT_SIZE = 9;

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return "-";
      if (typeof value === "number")
        return currencySymbol
          ? `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
          : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return String(value);
    };

    // Helper to render a bordered table for a given slice of projects
    const renderProjectTable = (
      projectSlice: any[],
      projectOffset: number,
      isLastPage: boolean,
    ) => {
      const left = doc.page.margins.left;
      const usableWidth = doc.page.width - left - doc.page.margins.right;

      // Build column definitions: [row-label col, ...project cols, optional Total col]
      const projectNames = projectSlice.map(
        (p, i) =>
          p?.["Project Name"] ||
          p?.["Project Credit Summary"] ||
          `Project ${projectOffset + i + 1}`,
      );
      const headerLabels = isLastPage
        ? ["", ...projectNames, "Total"]
        : ["", ...projectNames];

      const numCols = headerLabels.length;
      // First column (row label) gets 35% of usable width; rest split equally
      const labelColWidth = Math.floor(usableWidth * 0.35);
      const dataColWidth = Math.floor(
        (usableWidth - labelColWidth) / (numCols - 1),
      );
      const colWidths = [
        labelColWidth,
        ...Array(numCols - 1).fill(dataColWidth),
      ];

      // ── Draw header row ──────────────────────────────────────────────────────
      const drawRow = (
        cellTexts: string[],
        currentY: number,
        rowHeight: number,
        isBold: boolean,
        isHeader: boolean,
      ) => {
        let cellX = left;
        cellTexts.forEach((text, colIdx) => {
          const cw = colWidths[colIdx];
          // Cell background for header
          if (isHeader) {
            doc
              .save()
              .rect(cellX, currentY, cw, rowHeight)
              .fill("#E8E8E8")
              .restore();
          }
          // Cell border
          doc.rect(cellX, currentY, cw, rowHeight).stroke();
          // Cell text — save y before, restore after so pdfkit cursor never drifts
          const savedY = doc.y;
          doc
            .font(isBold || isHeader ? "Helvetica-Bold" : "Helvetica")
            .fontSize(isHeader ? HEADER_FONT_SIZE : FONT_SIZE)
            .text(text, cellX + ROW_PADDING, currentY + ROW_PADDING, {
              width: cw - ROW_PADDING * 2,
              align: colIdx === 0 ? "left" : "right",
              lineBreak: false,
              lineGap: 0,
            });
          doc.y = savedY; // prevent pdfkit from advancing the cursor between cells
          cellX += cw;
        });
      };

      // Measure row height for a set of cell texts
      const measureRowHeight = (
        cellTexts: string[],
        isHeader: boolean,
      ): number => {
        const maxHeight = Math.max(
          ...cellTexts.map((text, colIdx) =>
            doc
              .fontSize(isHeader ? HEADER_FONT_SIZE : FONT_SIZE)
              .heightOfString(text, {
                width: colWidths[colIdx] - ROW_PADDING * 2,
              }),
          ),
        );
        return maxHeight + ROW_PADDING * 2;
      };

      // Page-break-aware row emitter
      const emitRow = (
        cellTexts: string[],
        isBold: boolean,
        isHeader: boolean,
      ) => {
        const rowHeight = measureRowHeight(cellTexts, isHeader);
        // If row won't fit, add a new page and reset Y
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }
        drawRow(cellTexts, doc.y, rowHeight, isBold, isHeader);
        doc.y += rowHeight; // advance cursor manually (we used absolute coords)
      };

      // ── Header row (project names) ───────────────────────────────────────────
      emitRow(headerLabels, true, true);

      // ── Data rows (one per field) ────────────────────────────────────────────
      columns.slice(1).forEach((field) => {
        const isBold = boldFields.includes(field);

        const projectValues = projectSlice.map((proj) =>
          formatValue(proj?.[field] ?? "-"),
        );

        const totalValue = isLastPage ? formatValue(total[field] ?? "") : null;

        const cellTexts =
          totalValue !== null
            ? [field, ...projectValues, totalValue]
            : [field, ...projectValues];

        emitRow(cellTexts, isBold, false);
      });

      doc.moveDown(1);
    };
    // Paginate projects: 2 per page
    const projectsPerPage = 2;
    const totalPages = Math.ceil(projects.length / projectsPerPage);

    for (let i = 0; i < projects.length; i += projectsPerPage) {
      if (i > 0) {
        doc.addPage();
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Ireland R&D Credit Summary", { align: "center" });
        doc.moveDown(1);
        doc.fontSize(11).font("Helvetica");
        Object.entries(computedFields.Title || {}).forEach(([label, value]) => {
          doc
            .font("Helvetica-Bold")
            .text(label + ":", { continued: true })
            .font("Helvetica")
            .text(" " + value);
        });
        doc.moveDown(1);
      }
      const projectSlice = projects.slice(i, i + projectsPerPage);
      const currentPage = Math.floor(i / projectsPerPage);
      const isLastPage = currentPage === totalPages - 1;
      renderProjectTable(projectSlice, i, isLastPage);
    }

    // Set up event listeners before ending the document
    const buffers: Buffer[] = [];
    doc.on("data", (d: Buffer) => buffers.push(d));

    return new Promise<string>((resolve, reject) => {
      doc.on("end", async () => {
        const pdfBuffer = Buffer.concat(buffers);

        // Upload directly to blob storage from buffer
        //      const fs = require('fs');
        // const path = require('path');
        // const localDir = path.resolve(__dirname, '../../../output/pdfs');
        // if (!fs.existsSync(localDir)) {
        //   fs.mkdirSync(localDir, { recursive: true });
        // }
        // const localPath = path.join(localDir, `ireland_credit_${caseRid}_${Date.now()}.pdf`);
        // fs.writeFileSync(localPath, pdfBuffer);
        // logMessage(`Ireland PDF stored locally for testing: ${localPath}`);

        const blobName = `cases/${caseRid}/rdForms/ireland_credit_${caseRid}_${Date.now()}.pdf`;
        try {
          const blobUrl = await uploadBufferToAzureBlob(
            pdfBuffer,
            blobName,
            accountNumber,
          );
          logMessage(`Ireland PDF uploaded to blob: ${blobUrl}`);
          resolve(blobUrl);
        } catch (error) {
          this.logger.error(`Error uploading Ireland PDF to blob: ${error}`);
          reject(error);
        }
      });
      doc.on("error", reject);
      doc.end();
    });
  }
  async enhanceMapperConfigWithDynamicValues(
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
      const fieldId = configItem.field_id;
      logMessage(
        `[EnhanceConfig] Processing config item: ${fieldLabel} (field_id=${fieldId})`,
      );
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
        fieldLabel === "Total -> Equals Ratio (D) [Col.B/Col.C]" ||
        fieldId === "Equals Ratio D ColBColCE Total from Column D"
      ) {
        try {
          // Only sum for the past three years from the fiscal year
          const fiscalYearInt = parseInt(fiscalYear || "0", 10) - 1;
          const years = [fiscalYearInt, fiscalYearInt - 1, fiscalYearInt - 2];
          // Assuming there is a 'year' column in case_history_submission
          const query = rawQueries.getHistoricalSubmissionData(
            accountRid,
            stateRid || "",
            years,
            schemaName,
          );
          const orgDb = await this.getOrgDb();
          const [result]: any[] = await orgDb.query(query);
          const totalValue = result?.[0]?.total_value ?? 0;
          value = this.roundToTwoDecimals(Number(totalValue));
          logMessage(
            `Custom sum for field ${fieldLabel} (last 3 years): ${value}`,
          );
          this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        } catch (err) {
          logMessage(
            `Error in custom sum for field ${fieldLabel} (exception): ${err}`,
          );
          this.pushEnhancedConfig(enhancedConfigs, configItem, 0);
        }
        continue;
      }
      if (
        configItem.calculation_config &&
        configItem.field_type === "Line-Item"
      ) {
        await this.handleLineItemConfig(configItem, enhancedConfigs, {
          accountRid,
          effectiveStart,
          caseRid,
          schemaName,
          stateRid,
          countryRid,
        });
      } else if (configItem.field_type === "Table-Item") {
        await this.handleTableConfig(configItem, enhancedConfigs, {
          accountRid,
          caseRid,
          schemaName,
          stateRid: stateRid || "",
          fiscalYear,
        });
      } else {
        // Default case for other field types
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
      }
    }

    const valueMap = new Map<string, any>();
    // Regex to detect an unresolved RID value — used to prevent a resolved
    // numeric/string value from being overwritten by a stale raw RID.
    const RID_VALUE_PATTERN = /^[A-Za-z]\d{3}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const safeSet = (key: string, value: any) => {
      // Never downgrade an already-resolved value back to a raw RID string.
      // This prevents later config items (whose values haven't been resolved yet)
      // from clobbering a key that a previous item already resolved correctly.
      const existing = valueMap.get(key);
      const incomingIsRid = typeof value === 'string' && RID_VALUE_PATTERN.test(value.trim());
      const existingIsResolved =
        existing !== undefined &&
        !(typeof existing === 'string' && RID_VALUE_PATTERN.test(String(existing).trim()));
      if (existingIsResolved && incomingIsRid) return; // don't overwrite resolved with stale RID
      valueMap.set(key, value ?? 0);
    };
    const addToValueMap = (rawKey: string, value: any) => {
      if (!rawKey) return;
      safeSet(rawKey, value ?? 0);

      const noIndexKey = this.stripIndexes(rawKey);
      safeSet(noIndexKey, value ?? 0);

      const normalizedKey = this.normalizeFieldRef(rawKey);
      safeSet(normalizedKey, value ?? 0);

      // Index by leading line-number prefix (e.g. "17a" from "17a. Regular credit. Add line 4...")
      // Allows #17a to resolve even when the full label contains commas that truncate the regex capture.
      const linePrefixMatch = rawKey.match(/^(\d+[a-z]?\b)/i);
      if (linePrefixMatch && linePrefixMatch[1]) {
        safeSet(linePrefixMatch[1], value ?? 0);
        safeSet(linePrefixMatch[1].toLowerCase(), value ?? 0);
      }

      // Also index up to the first comma — the #label regex stops at commas, so a reference like
      // #17a. Regular credit. Add line 4 and line 16. If you do not elect...
      // gets captured only up to the comma. Storing that prefix ensures the lookup still hits.
      const upToComma = rawKey.split(",")[0]?.trim();
      if (upToComma && upToComma !== rawKey) {
        safeSet(upToComma, value ?? 0);
        safeSet(upToComma.replace(/\s+/g, ""), value ?? 0);
      }
    };

    enhancedConfigs.forEach((item) => {
      // For value lookup, only use value_field_id_cleaned
      if (item.value_field_id_cleaned) {
        addToValueMap(item.value_field_id_cleaned, item.value);
      }
      // For filling, use the original field_id (do not clean)
      if (item.field_id) {
        addToValueMap(item.field_id, item.value);
      }
      // Optionally, keep field_name for legacy lookups
      if (item.field_name) {
        addToValueMap(item.field_name, item.value);
      }
      // Add field_label for label-based references
      if (item.field_label) {
        addToValueMap(item.field_label, item.value);
      }
    });

    const resolveExpressionReferences = async () => {
      const seen = new Set<string>();

      for (const item of enhancedConfigs) {
        if (typeof item.value !== "string") continue;
        const expression = item.value.trim();
        const normalizedExpression = this.normalizeExpressionSyntax(expression);

        // Also handle bare RIDs stored without a leading '#'.
        // e.g. item.value = "U001-63184abd-..." (no # prefix) — these are
        // skipped by the '#' check below, so resolve them directly here.
        if (!normalizedExpression.includes("#")) {
          const bareRidMatch = expression.match(/^([A-Za-z]\d{3}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/);
          if (bareRidMatch && bareRidMatch[1]) {
            const bareRid = bareRidMatch[1];
            if (!seen.has(bareRid)) {
              seen.add(bareRid);
              const mapperObject =
                await this.rdFormMapperSchemaService.getDataMapperObjectByRid(bareRid);
              if (mapperObject?.ref_table && mapperObject?.field_name) {
                const dynamicValue =
                  await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
                    mapperObject.ref_table,
                    mapperObject.field_name,
                    mapperObject.is_json,
                    caseRid,
                    schemaName,
                    accountRid,
                    stateRid || "",
                  );
                if (dynamicValue !== null && dynamicValue !== undefined) {
                  addToValueMap(bareRid, dynamicValue);
                  // Also index by every label/id key so downstream #label refs
                  // (e.g. #13 from field 15) resolve to the correct value.
                  if (item.field_label) addToValueMap(String(item.field_label), dynamicValue);
                  if (item.field_id)    addToValueMap(String(item.field_id),    dynamicValue);
                  if (item.field_name)  addToValueMap(String(item.field_name),  dynamicValue);
                  if (item.value_field_id) addToValueMap(String(item.value_field_id), dynamicValue);
                  item.value = dynamicValue;
                  logMessage(
                    `Direct bare-RID resolution (no #) for field ${
                      item.field_label || item.field_id
                    }: ${bareRid} -> ${dynamicValue}`,
                  );
                }
              }
            }
          }
          continue;
        }

        const matches = normalizedExpression.matchAll(/#([A-Za-z0-9-_]+)/g);
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

          // Only skip DB resolution if the cached value is already a resolved
          // (non-RID) value. If valueMap holds another raw RID string for this key
          // (seeded from a not-yet-resolved config item), we must still fetch from DB.
          const isRidPattern = /^[A-Za-z]\d{3}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          const alreadyResolved = lookupKeys.some((key) => {
            if (!valueMap.has(key)) return false;
            const existing = valueMap.get(key);
            // Consider it resolved only when the stored value is NOT itself a raw RID
            return typeof existing !== 'string' || !isRidPattern.test(existing.trim());
          });
          if (alreadyResolved) continue;
          if (seen.has(rawKey)) continue;
          seen.add(rawKey);

          if (!/^[A-Za-z]\d{3}-[0-9a-fA-F-]{36}$/.test(rawKey)) continue;

          // Concise debug log for id resolution
          this.logger.debug(`Resolving data mapper object for RID: ${rawKey}`);
          const mapperObject =
            await this.rdFormMapperSchemaService.getDataMapperObjectByRid(
              rawKey,
            );

          if (!mapperObject?.ref_table || !mapperObject?.field_name) {
            logMessage(
              `RID not resolved: ${rawKey}. Using text comparison without #.`,
            );
            addToValueMap(rawKey, rawKey.replace(/^#/, ""));
            continue;
          }

          const dynamicValue =
            await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
              mapperObject.ref_table,
              mapperObject.field_name,
              mapperObject.is_json,
              caseRid,
              schemaName,
              accountRid,
              stateRid || "",
            );
          logMessage(
            `Resolved DB value for field ${item.field_label || item.field_id}: ${dynamicValue}`,
          );

          if (dynamicValue !== null && dynamicValue !== undefined) {
            addToValueMap(rawKey, dynamicValue);

            // If this item's entire value IS the bare RID (not part of a larger expression),
            // resolve it in-place now so the expression evaluation loop skips it entirely.
            // Without this, the loop would see the RID string, call resolveRef → tryParseNumber
            // on the DB value, get null for non-numeric strings (e.g. "Goldman Sachs"), and
            // silently overwrite the correct value with 0.
            const isBareRid =
              expression === rawKey || expression === `#${rawKey}`;
            if (isBareRid) {
              // Also index by every label/id key so downstream #label refs resolve correctly.
              if (item.field_label) addToValueMap(String(item.field_label), dynamicValue);
              if (item.field_id)    addToValueMap(String(item.field_id),    dynamicValue);
              if (item.field_name)  addToValueMap(String(item.field_name),  dynamicValue);
              if (item.value_field_id) addToValueMap(String(item.value_field_id), dynamicValue);
              item.value = dynamicValue;
              logMessage(
                `Direct RID resolution for field ${item.field_label || item.field_id}: ${rawKey} -> ${dynamicValue}`,
              );
            }
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

        // Skip plain text values — only process if value looks like an expression.
        // Plain strings (e.g. "Software Development", "Telecommunications") pass through unchanged.
        // Project codes like "P202-001" are NOT expressions — hyphens with no spaces aren't arithmetic.
        const isExpression = ((): boolean => {
          if (
            /#|\bIF\s*\(|\bTHEN\b|\bELSE\b|\bMIN\s*\(|\bMAX\s*\(/i.test(
              expression,
            )
          )
            return true;
          if (/[+*/]/.test(expression)) return true; // +, *, / are always arithmetic
          if (/\s-\s(?=[#\d])/.test(expression)) return true; // space-dash-space before ref/digit = binary minus
          if (/^[\d.]+$/.test(expression)) return true; // pure number
          if (/^[\d.\s+\-*/()]+$/.test(expression)) return true; // pure arithmetic expression
          if (/^[A-Za-z]\d{3}-[0-9a-fA-F-]{36}$/.test(expression)) return true; // bare RID
          if (/[A-Za-z]\d{3}-[0-9a-fA-F-]{36}/.test(expression)) return true; // contains RID
          return false;
        })();
        if (!isExpression) return;

        // Normalize syntax (handles custom IF, label, etc.)
        const normalizedExpression = this.normalizeExpressionSyntax(expression);

        logMessage(
          `Evaluating expression for field value ${item.field_label || item.field_id}: ${expression}`,
        );

        // Defensive: Track resolved values for debugging and type safety
        const resolvedValues: Record<
          string,
          { rawValue: any; numeric: number }
        > = {};

        // TWO-PASS # reference resolution:
        // Pass 1: resolve #RID (exact UUID format e.g. #U001-xxxx-...) — hyphens are part of the key
        // Pass 2: resolve #label (free-text field labels) — stops at operators, not hyphens

        // Strip trailing whitespace/commas/colons from a label key.
        // Also strips unbalanced trailing ) characters (e.g. outer IF/ternary closing paren)
        // while preserving balanced internal parens like '(.15)' or '(.50)'.
        // Returns the cleaned key AND any unbalanced ) suffix to be re-appended after substitution.
        const cleanLabelKey = (
          rawKey: string,
        ): { key: string; suffix: string } => {
          let s = rawKey
            .trim()
            .replace(/[\s,:{}<>]+$/, "")
            .trim();
          let suffix = "";
          while (s.endsWith(")")) {
            const opens = (s.match(/\(/g) || []).length;
            const closes = (s.match(/\)/g) || []).length;
            if (closes > opens) {
              suffix = ")" + suffix;
              s = s.slice(0, -1).trim();
            } else break;
          }
          return { key: s, suffix };
        };

        const resolveRef = (rawKey: string): string => {
          const { key: cleanedKey, suffix } = cleanLabelKey(rawKey);
          const normalizedKey = cleanedKey.replace(/\s+/g, " ").trim();

          if (evalCache.has(normalizedKey)) {
            const cached = evalCache.get(normalizedKey);
            const num = this.tryParseNumber(cached);
            return (num !== null ? String(num) : "0") + suffix;
          }

          // Build a progressively broader set of lookup keys:
          // 1. exact normalised label
          // 2. whitespace-collapsed version
          // 3. indexes stripped (e.g. label[0] → label)
          // 4. last path segment
          // 5. up to first comma (handles labels truncated by the comma stop rule in the # regex)
          // 6. leading line-number prefix (e.g. "17a" from "17a. Regular credit...")
          const upToCommaKey = normalizedKey?.split(",")?.[0]?.trim() || "";
          const linePrefixMatch = normalizedKey?.match(/^(\d+[a-z]?\b)/i);
          const lookupKeys = [
            normalizedKey,
            normalizedKey.replace(/\s+/g, ""),
            this.stripIndexes(normalizedKey),
            this.normalizeFieldRef(normalizedKey),
            ...(upToCommaKey && upToCommaKey !== normalizedKey
              ? [upToCommaKey, upToCommaKey.replace(/\s+/g, "")]
              : []),
            ...(linePrefixMatch
              ? [linePrefixMatch[1], linePrefixMatch[1]?.toLowerCase()]
              : []),
          ];

          for (const key of lookupKeys) {
            if (key && valueMap.has(key)) {
              const rawValue = valueMap.get(key);

              // If the cached value is itself an unresolved RID string, this field
              // hasn't been resolved yet (e.g. field 13 seeded as "U001-..." before
              // resolveExpressionReferences ran). Skip this hit so the expression loop
              // defers field 15 to a later pass when field 13 will be resolved.
              const valueIsUnresolvedRid =
                typeof rawValue === 'string' &&
                RID_VALUE_PATTERN.test(rawValue.trim());
              if (valueIsUnresolvedRid) continue;

              const num = this.tryParseNumber(rawValue);
              evalCache.set(normalizedKey, rawValue);
              logMessage(
                `Expression reference resolved for field ${item.field_label || item.field_id}: ${normalizedKey} -> ${JSON.stringify(rawValue)}`,
              );
              // For non-numeric values (e.g. "Goldman Sachs" from DB), return a JSON-quoted
              // string instead of "0" so string comparisons in compound expressions work correctly.
              // tryParseNumber returns null only when the value is genuinely non-numeric.
              return (num !== null ? String(num) : JSON.stringify(String(rawValue ?? ""))) + suffix;
            }
          }

          // No resolved value found — this reference is not yet available.
          // Return a sentinel NaN so the parent expression evaluates to NaN,
          // safeEval returns null, and the multi-pass loop retries on the next pass
          // once all dependencies have been resolved.
          logMessage(
            `Missing expression reference for field ${item.field_label || item.field_id}: ${normalizedKey} - not found in valueMap. Tried keys: ${JSON.stringify(lookupKeys)}`,
          );
          evalCache.set(normalizedKey, null);
          return "NaN" + suffix;
        };

        // Pre-pass: resolve MIN/MAX(#label, #label) with a depth-aware scanner.
        // This handles labels that contain commas or parentheses (e.g. "50% (.50)"),
        // which would confuse a regex-based arg splitter.
        // Args are split on ", #" (comma+space+hash) so commas inside labels are safe.
        const resolveMinMaxArgs = (expr: string): string => {
          let result = "";
          let i = 0;
          while (i < expr.length) {
            const fnMatch = expr.slice(i).match(/^(MIN|MAX)\s*\(/i);
            if (fnMatch) {
              const fnName = fnMatch[1] as string;
              i += fnMatch[0].length;
              let depth = 1;
              const innerStart = i;
              while (i < expr.length) {
                if (expr[i] === "(") depth++;
                else if (expr[i] === ")") {
                  depth--;
                  if (depth === 0) break;
                }
                i++;
              }
              const inner = expr.slice(innerStart, i);
              i++; // consume closing )
              // Split only on ", #" so commas inside label text are preserved
              const args = inner.split(/,\s*(?=#)/);
              const resolvedArgs = args.map((arg) => {
                const trimmed = arg.trim();
                return trimmed.startsWith("#")
                  ? resolveRef(trimmed.slice(1))
                  : trimmed;
              });
              result +=
                "Math." +
                fnName.toLowerCase() +
                "(" +
                resolvedArgs.join(", ") +
                ")";
            } else {
              result += expr[i++];
            }
          }
          return result;
        };

        // Pass 1: resolve MIN/MAX with label args (depth-aware, handles parens/commas in labels)
        let replaced = resolveMinMaxArgs(normalizedExpression);

        // Pass 2: replace remaining #RID tokens (UUID format — hyphens are part of the key)
        replaced = replaced.replace(
          /#([A-Za-z]\d{3}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g,
          (_match: string, rawKey: string) => resolveRef(rawKey),
        );

        // Pass 3: replace remaining #label tokens (free-text — stop at operators or next #)
        // Labels may contain parens like '(.15)' so ( and ) are NOT in the capture exclusion set.
        // Unbalanced trailing ) are stripped in resolveRef and re-appended after substitution.
        // : stops capture for ternary operator context; space-dash-space stops for binary minus.
        // = and ? are also stop characters so that ternary/comparison operators produced by
        // normalizeExpressionSyntax (=== → ==, IF → ternary ?) are never swallowed into the label.
        // e.g. "#Item01b == 0 ? ..." must capture only "Item01b", not "Item01b == 0 ?".
        replaced = replaced.replace(
          /#([^#+*/=?]+?)(?=\s*[+*\/:<>{}=?]|\s+-\s+(?=[#\d])|\s*,|\s*#|\s*$)/g,
          (_match: string, rawKey: string) => resolveRef(rawKey),
        );

        // Defensive: Replace bare min/max( with Math.min/max( — skip if already prefixed with Math.
        replaced = replaced
          .replace(/(?<!Math\.)\bmin\s*\(/gi, "Math.min(")
          .replace(/(?<!Math\.)\bmax\s*\(/gi, "Math.max(");
        replaced = this.transformIfExpressions(replaced);

        // Post-substitution cleanup: strip residual plain-text fragments left when a long
        // #label was partially captured (the comma stop-rule left a prose tail).
        // e.g. ", enter the result here, and see instructions for the schedule to attach * 0.9116"
        //   becomes "* 0.9116"
        // Only strips text between a comma and an arithmetic operator so no numeric data is lost.
        replaced = replaced.replace(
          /,\s*[^+\-*/()#\d,][^+\-*/()*]*(?=[+\-*/])/g,
          " ",
        );

        // Defensive: Validate only allowed characters/operators
        // After # substitution, expression should only contain digits, arithmetic operators,
        // parentheses, decimals, spaces, Math.min/max calls, ternary operators, and NaN.
        // A-Za-z is NOT broadly permitted to prevent identifier injection.
        // Strip known safe function names before character validation
        const validationTarget = replaced
          .replace(/Math\.(min|max)\(/g, "(")
          .replace(/\bString\(/g, "(")
          .replace(/\b(true|false|null|NaN|Infinity)\b/g, "0");
        if (!/^[\d\s+\-*/().,?:<>=!&|'"]+$/.test(validationTarget)) {
          // If the original expression contained no # refs or operators, it's a plain
          // text value (e.g. "P202-001", "Software Development") — preserve it as-is.
          const hadExpressionMarkers =
            /#|\bIF\s*\(|\bTHEN\b|\bELSE\b|\bMIN\s*\(|\bMAX\s*\(|[+*/]|\s-\s(?=[#\d])/i.test(
              expression,
            );
          if (!hadExpressionMarkers) {
            // Plain string value — not an expression, leave value unchanged
            logMessage(
              `Preserving plain text value for field ${item.field_label || item.field_id}: ${expression}`,
            );
            return;
          }
          logMessage(
            `Blocked invalid expression for field ${item.field_label || item.field_id}: ${expression}`,
          );
          item.value = null;
          return;
        }

        // --- Safe Evaluation (no dynamic code execution) ---
        try {
          const safeEval = (expr: string): number | null => {
            try {
              // Build a sandboxed evaluator: only Math is exposed, no globals
              // eslint-disable-next-line no-new-func
              const fn = new Function(
                "Math",
                `"use strict"; return (${expr});`,
              );
              const result = fn(Math);
              if (result === null || result === undefined) return null;
              if (typeof result === "boolean") return result ? 1 : 0;
              // NaN means at least one #ref resolved to the "NaN" sentinel, meaning
              // a dependency is not yet computed. Return null so the multi-pass loop
              // leaves item.value unchanged and retries on the next pass.
              if (typeof result === "number" && Number.isNaN(result)) return null;
              if (typeof result === "number" && !Number.isFinite(result)) return 0;
              return result;
            } catch (err) {
              return null;
            }
          };

          const computed = safeEval(replaced);
          if (computed !== null) {
            // Clamp negative results to 0, with a warning log
            if (computed < 0) {
              logMessage(
                `Warning: Negative computed value (${computed}) clamped to 0 for field ${item.field_label || item.field_id}. Expression: ${expression}`,
              );
            }
            const finalValue = this.roundToTwoDecimals(Math.max(0, computed));

            logMessage(
              `Resolved values for field ${item.field_label || item.field_id}: ${expression} => ${replaced}`,
            );

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
            // Also refresh field_label in valueMap so downstream #label references
            // (e.g. #13 in field 15's expression) resolve to the freshly-computed
            // numeric value instead of the stale raw RID stored during pre-loop seeding.
            if (item.field_label) {
              addToValueMap(String(item.field_label), item.value);
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
      logMessage(
        `Field "${item.field_label || item.field_id}" could not be resolved after ${maxExpressionPasses} passes. Setting value to null.`,
      );
      item.value = null;
    });
    return enhancedConfigs;
  }

  /**
   * Handle line item configuration by resolving dynamic values
   * @param configItem - Configuration item to process
   * @param enhancedConfigs - Array to store enhanced configurations
   * @param context - Context object containing account, case, and schema information
   */
  async handleLineItemConfig(
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
        this.logger.warn(
          `Error parsing calculation_config for field ${configItem.field_label}: ${error}`,
        );
        calcConfig = null;
      }
    }

    if (
      calcConfig &&
      typeof calcConfig === "object" &&
      !Array.isArray(calcConfig)
    ) {
      // If config contains a special 'expression' key, use it directly
      if (calcConfig.expression && typeof calcConfig.expression === "string") {
        value = calcConfig.expression;
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        return;
      }

      // Otherwise, try to reconstruct an expression from the config keys/values
      const operatorMap: Record<string, string> = {
        add: "+",
        sub: "-sub-",
        subtract: "-sub-",
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
          if (/\b(min|max|if)\s*\(/i.test(strVal) || /^\(.*\)$/.test(strVal)) {
            value = strVal;
            this.pushEnhancedConfig(enhancedConfigs, configItem, value);
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
        if (typeof val === "string") {
          const op = operatorMap[val.toLowerCase()];
          if (op) {
            tokens.push(op);
          } else {
            tokens.push(flattenConfigValue(val));
          }
        } else {
          tokens.push(flattenConfigValue(val));
        }
      }
      // Join tokens with spaces (infix), e.g. "A + B * (C + D)"
      const infixExpr = tokens.join(" ");
      // Always treat as expression if all tokens are numbers/operators/expressions
      const allTokensAreExpr = tokens.every((t) =>
        /^(\d+(\.\d+)?|[()+\-*/]|\(.*\))$/.test(t),
      );
      if (/[()+\-*/]/.test(infixExpr) || allTokensAreExpr) {
        value = infixExpr;
        this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        return;
      }
    }

    for (const [key, rid] of Object.entries(calcConfig)) {
      if (typeof rid === "number") {
        value = rid;
        continue;
      }

      if (typeof rid === "string") {
        const parsedLiteral = this.tryParseNumber(rid);
        if (parsedLiteral !== null && /[0-9]/.test(rid)) {
          value = parsedLiteral;
          continue;
        }

        if (/^\s*(min|max)\s*\(/i.test(rid)) {
          value = rid;
          continue;
        }

        if (rid.includes("#")) {
          value = rid;
          continue;
        }
      }

      // Guard: rid must be a non-empty string to be a valid RID for DB lookup
      if (typeof rid !== "string" || !rid.trim()) {
        continue;
      }

      try {
        const mapperObject =
          await this.rdFormMapperSchemaService.getDataMapperObjectByRid(
            rid.trim(),
          );
        if (mapperObject?.ref_table && mapperObject?.field_name) {
          const dynamicValue =
            await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
              mapperObject.ref_table,
              mapperObject.field_name,
              mapperObject.is_json,
              context.caseRid,
              context.schemaName,
              context.accountRid,
              context.stateRid || "",
            );

          if (dynamicValue !== null) {
            value = dynamicValue;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error fetching dynamic value for ${configItem.field_label}:`,
          error,
        );
      }
    }

    this.pushEnhancedConfig(enhancedConfigs, configItem, value);
  }

  /**
   * Handle table configuration by resolving row-specific values
   * @param configItem - Table configuration item
   * @param enhancedConfigs - Array to store enhanced configurations
   * @param context - Context object containing account, case, and schema information
   */
  async handleTableConfig(
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
          this.logger.warn(`Error parsing column ID list: ${parseError}`);
          fieldMappings = {};
        }

        if (Object.keys(fieldMappings).length === 0) {
          this.pushEnhancedConfig(enhancedConfigs, configItem, "");
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

              resolved = this.normalizeExpressionSyntax(resolved);
              resolved = this.transformIfExpressions(resolved);

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
          this.pushEnhancedConfig(enhancedConfigs, configItem, finalValue, {
            label: `${configItem.field_label}[row_${rowNumber}]`,
            field_name: configItem.field_name,
            value_field_id: fieldPath,
          });
        }

        return;
      } catch (error) {
        this.logger.error(
          `Error computing table config for ${configItem.field_label}:`,
          error,
        );
        this.pushEnhancedConfig(enhancedConfigs, configItem, "");
        return;
      }
    }

    // 🔹 Default fallback
    this.pushEnhancedConfig(enhancedConfigs, configItem, configItem.value);
  }
}