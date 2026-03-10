import { or, QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import RdFormMapperSchemaService from "./schemaService";
import { generateSasUrl, logMessage, uploadBufferToAzureBlob, uploadToAzureBlob } from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import { HttpStatus, rawQueries, RD_FORM_HEADER_BY_COUNTRY, STATUS_MESSAGE, COUNTRY_CURRENCY_CODE, FORM_TYPE, eventTypes, entityTypes, eventNames } from "../../utils/constants";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { Kafka, Producer } from "kafkajs";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { calculateFiscalYearDateRange } from "../../utils/dateFunction";
import { fetchProjectCostDetailsBasedOnCasesForRdforms, fetchTotalResourcesForCase } from "../../utils/rdFinancialWorkingQueries";
import { HelperMethods } from "../cases/helperMethods";
import { CaseModelService } from "../caseModelsService";
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
  private helperMethod: HelperMethods
  private caseModelService:CaseModelService = new CaseModelService();


  constructor(logger: Logger) {
    this.logger = logger;
    this.rdFormMapperSchemaService = new RdFormMapperSchemaService();
    this.rdCreditSchemaService = new RDCreditSchemaService();
    this.helperMethod = new HelperMethods(
          this.caseModelService
        );
    
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private formatNumber(value: any): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof num === 'number' && !isNaN(num)) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return String(value || '-');
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

  private async fetchProjectCostDetailsBasedOnCases(caseRid: string, accountRid: string, schemaName: string, orgDb: Sequelize) {
    const query =await  fetchProjectCostDetailsBasedOnCasesForRdforms(caseRid, accountRid, schemaName);
    const [result]: any[] = await orgDb.query(query, { type: QueryTypes.SELECT });
    return result?.projects || [];
  }

  private async fetchTotalResourcesForCase(caseRid: string, accountRid: string, schemaName: string, orgDb: Sequelize) {
    const query = await fetchTotalResourcesForCase(caseRid, accountRid, schemaName);
    const [result]: any[] = await orgDb.query(query, { type: QueryTypes.SELECT });
    return result?.total_resources || 0;
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
    let filledFormUrl: string;
      // If country is Ireland, generate dynamic PDF using generateIrelandCreditPdf FIRST
    const countryNameNorm = (countryName || '').trim().toLowerCase();
   if (countryNameNorm === 'ireland' || countryNameNorm === 'irl') {
      logMessage('Country is Ireland. Generating dynamic Ireland PDF.');
      const filledFormUrl = await this.generateIrelandCreditPdf(caseRid, schemaName, accountNumber);
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
        data: filledFormUrl
      };
    } else if (countryNameNorm === 'united kingdom' || countryNameNorm === 'uk' || countryNameNorm === 'gb') {
      return await this.processUKForms(accountRid, caseRid, countryRid, accountNumber, mainDb, orgDb, schemaName, countryName);
    }

    try {
    const formInfo = await this.rdFormMapperSchemaService.getFederalForms(
      accountRid,
      countryRid,
      mainDb,
      effectiveStart,
      effectiveEnd,
    );

    if(!formInfo) {
       await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        countryRid,
        orgDb,
        accountNumber,
        "No valid data uploaded to process RD forms"
      );
    }

    if (!formInfo?.browse_file && formInfo?.form_type === FORM_TYPE.Fillable) {
      await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        countryRid,
        orgDb,
        accountNumber,
        "No valid data uploaded to process RD forms"
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
      await this.rdFormMapperSchemaService.updateFederalFormError(
        caseRid,
        countryRid,
        orgDb,
        accountNumber,
        `No valid data uploaded to process RD forms`
      );
      throw new Error(
        `No valid data uploaded to process RD forms`
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


    
    // If country is Ireland, generate dynamic PDF using generateIrelandCreditPdf
   
   if (formInfo?.form_type === FORM_TYPE["Non-Fillable"]) {
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
    } catch (error) {
      this.logger.error("Error processing federal form:", error);
      await this.updateFederalFormError(caseRid, countryRid, error instanceof Error ? error.message : String(error), orgDb);
      return {
        statusCode: HttpStatus.FAILED,
        message: "Federal form processing failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process UK form filling
   */
  private async processUKForms(
    accountRid: string,
    caseRid: string,
    countryRid: string,
    accountNumber: string,
    mainDb: Sequelize,
    orgDb: Sequelize,
    schemaName: string,
    countryName: string
  ): Promise<any> {
    logMessage('Country is UK. Generating dynamic UK PDF.');
    // Fetch extracted text from database or assume it's in computed_fields
    const [calcRow]: any[] = await orgDb.query(
      rawQueries.fetchCountryCalculationForCase(schemaName),
      { replacements: { caseRid }, type: QueryTypes.SELECT }
    );
    if (!calcRow) throw new Error('No calculation found for this case');
    const computedFields = typeof calcRow.computed_fields === 'string' ? JSON.parse(calcRow.computed_fields) : calcRow.computed_fields;
    const [accountInfo]:any[] = await mainDb.query(
      rawQueries.fetchAccountAndCountryDetails(accountRid),
      { replacements: { accountRid }, type: QueryTypes.SELECT }
    );
    const [caseInfo]:any[] = await orgDb.query(
      rawQueries.fetchCaseById(schemaName),
      { replacements: { caseId : caseRid }, type: QueryTypes.SELECT }
    );
     const [accountDetails]:any[] = await orgDb.query(
      rawQueries.fetchAccountStartEndDate(accountRid,schemaName),
      {  type: QueryTypes.SELECT }
    );

     const currencySymbol = await this.getCurrencySymbolByCountry(
      countryName,
      mainDb,
    );
    
    const projectInfo = await this.fetchProjectCostDetailsBasedOnCases(caseRid, accountRid, schemaName, orgDb);
    const resoucesCount = await this.fetchTotalResourcesForCase(caseRid, accountRid, schemaName, orgDb);
    const projectInfoWithExtras = projectInfo.map(({ qre_final, ...p }: any) => ({
      ...p,
        "Project QRE": currencySymbol ? `${currencySymbol}${this.formatNumber(qre_final || "-")}` : this.formatNumber(qre_final || "-"),
      "Main field of science or technology": "-",
      "Existing scientific or technological knowledge it planned to improve": "-",
      "Advancement in knowledge it aimed to achieve": "-",
      "Scientific or Technological Uncertainties Faced": "-",
      "How the project sought to overcome uncertainties": "-",

    }));
    
    const fiscalYear = parseInt(caseInfo.fiscal_year);
    const startDate = `${accountDetails.fiscal_start_date}/${fiscalYear - 1}`;
    const endDate = `${accountDetails.fiscal_end_date}/${fiscalYear}`;
    const accountingPeriodFormatted = `${this.formatDate(startDate)} to ${this.formatDate(endDate)}`;
    
   let ukFormData = {
        "business_details": {
          "business_name": accountInfo.account_name || '',
          "corporation_tax_unique_taxpayer_reference": "",
          "correct_corporation_tax_reference": "-",
          "has_paye_reference": "-",
          "employer_paye_reference": "-",
          "has_vat_number": "-",
          "vat_number": "-",
          "type_of_business": "-"
        },
        "contact_and_agent_details": {
          "full_name": "-",
          "senior_officer_responsible": "-",
          "role_in_company": "-",
          "confirmation_email": "-",
          "telephone_number": "-",
          "has_tax_agent_for_rd_claim": "-"
        },
        "rd_scheme": {
          "scheme_type": "RDEC"
        },
        "rdec_qualifying_expenditure": {
          "staffing_costs": currencySymbol ? `${currencySymbol}${this.formatNumber(computedFields.Total?.Employees)}` : this.formatNumber(computedFields.Total?.Employees),
          "externally_provided_workers": currencySymbol ? `${currencySymbol}${this.formatNumber(computedFields.Total?.["Net EPW"] || "-")}` : this.formatNumber(computedFields.Total?.["Net EPW"] || "-"),
          "number_of_epws": resoucesCount || "-",
          "software": currencySymbol ? `${currencySymbol}${this.formatNumber(caseInfo.material_software_cost)}` : this.formatNumber(caseInfo.material_software_cost),
          "consumable_items": currencySymbol ? `${currencySymbol}${this.formatNumber(caseInfo.heat_light_power)}` : this.formatNumber(caseInfo.heat_light_power)
        },
        "summary_rdec_qualifying_expenditure" : {
          [`Accounting period ${accountingPeriodFormatted}`]: currencySymbol ? `${currencySymbol}${this.formatNumber(computedFields["Percentage Calculation"]?.["Total QRE"] || "-")}` : this.formatNumber(computedFields["Percentage Calculation"]?.["Total QRE"] || "-"),
          "qualifying_indirect_activities":"-"
        },
        "projects": projectInfoWithExtras,
      }
    const filledFormUrl = await this.generateUKCreditPdf(ukFormData, caseRid, accountNumber);
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
      data: filledFormUrl
    };
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
          "No valid data uploaded to process RD forms"
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
        await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
          `No valid data uploaded to process RD forms`
        );
        continue;
      }

      logMessage(
        `Found ${mapperConfig.length} state mapper configuration(s) for ${state}`,
      );

      try {
      const enhancedMapperConfig =
        await this.enhanceMapperConfigWithDynamicValues(
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
      } catch (error) {
        this.logger.error(`Error processing state form for ${state}:`, error);
       await this.rdFormMapperSchemaService.updateStateFormError(
          caseRid,
          countryRid,
          state,
          orgDb,
          accountNumber,
          "No valid data uploaded to process RD forms"
        );
      }
    }

    logMessage(
      `Successfully completed state form processing for case: ${caseRid}`,
    );
  }
async generateIrelandCreditPdf(caseRid: string, schemaName: string, accountNumber: string): Promise<string> {
  const orgDb = await this.getOrgDb();
  const mainDb = await this.getMainDb();
  const currencySymbol = await this.getCurrencySymbolByCountry('Ireland', mainDb);
  const [caseRow]: any[] = await orgDb.query(
   rawQueries.fetchCaseInfo(schemaName,caseRid),
    { replacements: { caseRid }, type: QueryTypes.SELECT }
  );
  if (!caseRow) throw new Error('Case not found');
  const [calcRow]: any[] = await orgDb.query(
    rawQueries.fetchCountryCalculationForCase(schemaName),
    { replacements: { caseRid }, type: QueryTypes.SELECT }
  );
  if (!calcRow) throw new Error('No calculation found for this case');
  
  const inputParams = typeof calcRow.input_params === 'string' ? JSON.parse(calcRow.input_params) : calcRow.input_params;
  if (!inputParams || inputParams.country !== 'IRL') throw new Error('Country is not Ireland (IRL)');
  
  const computedFields = typeof calcRow.computed_fields === 'string' ? JSON.parse(calcRow.computed_fields) : calcRow.computed_fields;
  if (!computedFields) throw new Error('No computed_fields found');

  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const titleFields = computedFields.Title || {};
  doc.fontSize(16).font('Helvetica-Bold').text('Ireland R&D Credit Summary', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).font('Helvetica');
  Object.entries(titleFields).forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label + ':', { continued: true }).font('Helvetica').text(' ' + value);
  });
  doc.moveDown(1);

  const columns: string[] = computedFields.Columns || [];
  const projects: any[] = computedFields.Projects || [];
  const total: Record<string, any> = computedFields.Total || {};
  const boldFields: string[] = computedFields.BOLD || [];
  if (!columns.length) throw new Error('No columns found in computed_fields');


  // Helper to render a table for a given set of projects
  const renderProjectTable = (projectSlice: any[], projectOffset: number, isLastPage: boolean) => {
    // Use the actual number of projects in the slice, no padding
    const maxProjects = projectSlice.length;
    const projectNames = [];
    for (let idx = 0; idx < maxProjects; idx++) {
      if (projectSlice[idx]) {
        projectNames.push(projectSlice[idx]['Project Name'] || projectSlice[idx]['Project Credit Summary'] || `Project ${projectOffset + idx + 1}`);
      } else {
        projectNames.push('-');
      }
    }
    const tableCols = isLastPage ? ['', ...projectNames, 'Total'] : ['', ...projectNames];
    const colWidths = tableCols.map(() => Math.floor((doc.page.width - doc.page.margins.left - doc.page.margins.right) / tableCols.length));

    // Table header row
    doc.font('Helvetica-Bold').fontSize(10);
    let tableStartX = doc.page.margins.left;
    let x = tableStartX;
    tableCols.forEach((col, i) => {
      doc.text(col, x, doc.y, {
        width: colWidths[i],
        align: 'center',
        continued: i < tableCols.length - 1
      });
      x += colWidths[i];
    });
    doc.moveDown(1);  // Spacing after header

    // Print each field (column heading) as a row
    columns.slice(1).forEach((field, fieldIdx) => {
      x = tableStartX;
      doc.font(boldFields.includes(field) ? 'Helvetica-Bold' : 'Helvetica');
      // Field name
      doc.text(field, x, doc.y, {
        width: colWidths[0],
        align: 'left',
        continued: true
      });
      x += colWidths[0];

      // Each project value for this field (each in its own column)
      for (let projIdx = 0; projIdx < maxProjects; projIdx++) {
        let value: any = '-';
        if (projectSlice[projIdx]) {
          value = projectSlice[projIdx][field] ?? '-';
        }
        doc.font(boldFields.includes(field) ? 'Helvetica-Bold' : 'Helvetica');
        const formattedValue = typeof value === 'number'
          ? (currencySymbol ? `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : value.toLocaleString(undefined, { maximumFractionDigits: 2 }))
          : String(value);
        doc.text(
          formattedValue,
          x,
          doc.y,
          {
            width: colWidths[projIdx + 1],
            align: 'right',
            continued: projIdx < maxProjects - 1 || isLastPage  // Continue if not the last project or if last page (for total)
          }
        );
        x += colWidths[projIdx + 1];
      }

      // Total value for this field (only on last page)
      if (isLastPage) {
        doc.font(boldFields.includes(field) ? 'Helvetica-Bold' : 'Helvetica');
        const totalValue = total[field] ?? '';
        const formattedTotal = typeof totalValue === 'number'
          ? (currencySymbol ? `${currencySymbol}${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 }))
          : totalValue;
        doc.text(
          formattedTotal,
          x,
          doc.y,
          {
            width: colWidths[colWidths.length - 1],
            align: 'right',
            continued: false
          }
        );
      }
      doc.moveDown(1.5);  // Increased spacing between rows
    });
  };
  // Paginate projects: 2 per page
  const projectsPerPage = 2;
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  
  for (let i = 0; i < projects.length; i += projectsPerPage) {
    if (i > 0) {
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Ireland R&D Credit Summary', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica');
      Object.entries(computedFields.Title || {}).forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label + ':', { continued: true }).font('Helvetica').text(' ' + value);
      });
      doc.moveDown(1);
    }
    const projectSlice = projects.slice(i, i + projectsPerPage);
    const currentPage = Math.floor(i / projectsPerPage);
    const isLastPage = (currentPage === totalPages - 1);
    renderProjectTable(projectSlice, i, isLastPage);
  }

  // Set up event listeners before ending the document
  const buffers: Buffer[] = [];
  doc.on('data', (d: Buffer) => buffers.push(d));

  return new Promise<string>((resolve, reject) => {
    doc.on('end', async () => {
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
        const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, blobName, accountNumber);
        logMessage(`Ireland PDF uploaded to blob: ${blobUrl}`);
        resolve(blobUrl);
      } catch (error) {
        logMessage(`Error uploading Ireland PDF to blob: ${error}`);
        reject(error);
      }
    });
    doc.on('error', reject);
    doc.end();
  });
}
  /**
   * Generate UK Credit PDF from structured form data
   */
  async generateUKCreditPdf(ukFormData: any, caseRid: string, accountNumber: string): Promise<string> {
    
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    

    doc.fontSize(14).font('Helvetica-Bold').text('UK R&D Credit Summary', { align: 'center' });
    doc.moveDown(1);

    // Render sections
    this.renderUKSections(doc, ukFormData);

    // Set up event listeners before ending the document
    const buffers: Buffer[] = [];
    doc.on('data', (d: Buffer) => buffers.push(d));

    return new Promise<string>((resolve, reject) => {
      doc.on('end', async () => {
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
          const blobUrl = await uploadBufferToAzureBlob(pdfBuffer, blobName, accountNumber);
          logMessage(`UK PDF uploaded to blob: ${blobUrl}`);
          resolve(blobUrl);
        } catch (error) {
          logMessage(`Error uploading UK PDF to blob: ${error}`);
          reject(error);
        }
      });
      doc.on('error', reject);
      doc.end();
    });
  }

  /**
   * Render UK form sections in PDF
   */
  private renderUKSections(doc: any, ukFormData: any) {
    const sections = [
      { key: 'business_details', title: 'Business Details' },
      { key: 'contact_and_agent_details', title: 'Contact and Agent Details' },
      { key: 'accounting_period', title: 'Accounting Period' },
      { key: 'rd_scheme', title: 'R&D Scheme' },
      { key: 'rdec_qualifying_expenditure', title: 'RDEC Qualifying Expenditure' },
      {
        key: 'summary_rdec_qualifying_expenditure',
        title: 'Summary of RDEC Qualifying Expenditure',
      },
      { key: 'projects', title: 'Projects' }
    ];

    sections.forEach(section => {
      if (ukFormData[section.key]) {
        if (section.key === 'projects') {
         // doc.addPage();
          const left = doc.page.margins.left;
          doc.fontSize(12).font('Helvetica-Bold').text(section.title, left, doc.y, { underline: true });
          doc.moveDown(0.5);
          this.renderProjectsTable(doc, ukFormData[section.key]);
        } else {
          const left = doc.page.margins.left;
          if (typeof ukFormData[section.key] === 'string') {
            doc.fontSize(12).font('Helvetica-Bold').text(section.title + ':', { continued: true }).font('Helvetica').text(' ' + ukFormData[section.key]);
          } else {
            doc.fontSize(12).font('Helvetica-Bold').text(section.title, left, doc.y, { underline: true });
            doc.moveDown(0.5);
            this.renderSectionAsTable(doc, ukFormData[section.key]);
          }
          doc.moveDown(0.5);
        }

        doc.moveDown(0.5);
      }
    });
  }

  /**
   * Render section fields
   */
  private renderSectionFields(doc: any, sectionData: any) {
    const specialFields = [
      "Main Field Of Science Or Technology",
      "Existing Scientific Or Technological Knowledge It Planned To Improve",
      "Advancement In Knowledge It Aimed To Achieve",
      "Scientific Or Technological Uncertainties Faced",
      "How The Project Sought To Overcome Uncertainties"
    ];
    Object.keys(sectionData).forEach(key => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (specialFields.includes(displayKey)) {
        doc.fontSize(11).font('Helvetica-Bold').text(displayKey + ':');
        doc.moveDown(0.5);
        const value = sectionData[key] || '';
        doc.fontSize(11).font('Helvetica').text(value !== '-' ? value : ' - ');
        doc.moveDown(0.5);
      } else {
        doc.fontSize(11).font('Helvetica-Bold').text(displayKey + ':', { continued: true }).font('Helvetica').text(' ' + (sectionData[key] || ''));
        doc.moveDown(0.5);
      }
    });
  }

  /**
   * Render projects as key-value pairs
   */
  private renderProjectsTable(doc: any, projects: any[]) {
    projects.forEach((project: any, index: number) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`Project ${index + 1}:`, { underline: true });
      doc.moveDown(0.5);
      this.renderSectionFields(doc, project);
      doc.moveDown(0.5);
    });
  }

  /**
   * Render section as table with borders
   */
 private renderSectionAsTable(doc: any, sectionData: any) {
  const pageWidth = doc.page.width;
  const left = doc.page.margins.left;
  const right = doc.page.margins.right;
  const usableWidth = pageWidth - left - right;

  const colFieldWidth = Math.floor(usableWidth * 0.65);
  const colValueWidth = usableWidth - colFieldWidth;
  const rowPadding = 5;

  const startY = doc.y; // Track table start
  let currentY = startY;

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

    const rowHeight =
      Math.max(fieldHeight, valueHeight) + rowPadding * 2;

    // Page break check
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.y;
    }

    // Left cell border
    doc.rect(left, currentY, colFieldWidth, rowHeight).stroke();

    // Right cell border
    doc
      .rect(left + colFieldWidth, currentY, colValueWidth, rowHeight)
      .stroke();

    // Vertical divider
    doc
      .moveTo(left + colFieldWidth, currentY)
      .lineTo(left + colFieldWidth, currentY + rowHeight)
      .stroke();

    // Field text
    doc.font('Helvetica-Bold');
    doc.text(displayKey, left + rowPadding, currentY + rowPadding, {
      width: colFieldWidth - rowPadding * 2,
    });

    // Value text
    doc.font('Helvetica');
    doc.text(
      String(value),
      left + colFieldWidth + rowPadding,
      currentY + rowPadding,
      {
        width: colValueWidth - rowPadding * 2,
        align: "left",
      }
    );

    currentY += rowHeight;
  });

  // Draw final bottom border across entire table width
  doc
    .moveTo(left, currentY)
    .lineTo(pageWidth - right, currentY)
    .stroke();

  doc.y = currentY;
  doc.moveDown(0.5);
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
        // Increased padding for each row
        const rowPadding = 8;
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

          if (rawValue === 0 || rawValue === "0") {
            return "-";
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
          // Defensive: Ensure fieldName and value are never undefined/null
          const safeFieldName = fieldName !== undefined && fieldName !== null ? fieldName : "N/A";
          const displayValue = formatValue(value !== undefined && value !== null ? value : "N/A");
          const fieldHeight = doc.heightOfString(String(safeFieldName), {
            width: colFieldWidth - rowPadding * 2,
          });
          const valueHeight = doc.heightOfString(String(displayValue), {
            width: colValueWidth - rowPadding * 2,
          });
          // Add extra vertical padding for each row
          const extraPadding = 6;
          const rowHeight = Math.max(fieldHeight, valueHeight) + rowPadding * 2 + extraPadding;

          ensureSpace(rowHeight);

          const y = doc.y;
          doc.text(String(safeFieldName), left + rowPadding, y + rowPadding + extraPadding / 2, {
            width: colFieldWidth - rowPadding * 2,
          });
          doc.text(String(displayValue), left + colFieldWidth + colGap + rowPadding, y + rowPadding + extraPadding / 2, {
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
              String(applyCurrency ? formatValue(cell !== undefined && cell !== null ? cell : "N/A") : cell !== undefined && cell !== null ? cell : "N/A"),
              {
              width: (colWidths[index] ?? baseWidth) - rowPadding * 2,
              align,
            }),
          );
          // Add extra vertical padding for each grid row
          const extraPadding = 6;
          const rowHeight = Math.max(...cellHeights, 0) + rowPadding * 2 + extraPadding;

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
          const safeLabel = row.label !== undefined && row.label !== null ? row.label : "N/A";
          const safeValue = row.value !== undefined && row.value !== null ? row.value : "N/A";
          renderRow(safeLabel, safeValue);
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
            header !== undefined && header !== null ? header.toLowerCase().replace(/\s+/g, " ").trim() : "-";
          const normalizedHeaders = headers.map(normalizeHeader);
          const isAustraliaTierTable =
            isAustralia &&
            normalizedHeaders.some((h) => h.includes("tier of intensity")) &&
            normalizedHeaders.some((h) => h.includes("notional")) &&
            normalizedHeaders.some((h) => h.includes("offset"));

          doc.moveDown(0.5);
          doc.fontSize(10);
          renderGridRow(headers.map(h => h !== undefined && h !== null ? h : "-"), "center", false);
          rowIndexes.forEach((rowIndex) => {
            const rowValues = headers.map((header) => {
              const column = group.columns.get(header !== undefined && header !== null ? header : "-");
              if (!column) return "N/A";
              const cellValue = column.has(rowIndex) ? column.get(rowIndex) : "N/A";
              return cellValue !== undefined && cellValue !== null ? cellValue : "N/A";
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
        let errorMsg: string;
        if (pdfError instanceof Error) {
          errorMsg = pdfError.stack || pdfError.message;
        } else {
          errorMsg = String(pdfError);
        }
        logMessage(`Error creating PDF content: ${errorMsg}`);
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
    const cleanedFieldId = typeof configItem.field_id === 'string' ? configItem.field_id.trim().replace(/\s+/g, "") : configItem.field_id;
    enhancedConfigs.push({
      ...configItem,
      label: configItem.field_label,
      value_field_id: configItem.field_id,
      value_field_id_cleaned: cleanedFieldId,
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

    // Normalize custom subtraction token -sub- to real minus operator
    result = result.replace(/\s*-sub-\s*/gi, " - ");

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

// ✅ STEP 1: Convert block-style IF to comma-style IF
// Supports:
// IF(condition) { THEN expr1 } ELSE { THEN expr2 }
result = result.replace(
  /IF\s*\(([\s\S]*?)\)\s*\{\s*THEN\s*([\s\S]*?)\s*\}\s*ELSE\s*\{\s*THEN\s*([\s\S]*?)\s*\}/gi,
  "IF($1, $2, $3)"
);

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
      result.slice(0, ifIndex) +
      replacement +
      result.slice(closeIndex + 1);
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

    for (const [key, rid] of Object.entries(calcConfig)) {

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

      // Guard: rid must be a non-empty string to be a valid RID for DB lookup
      if (typeof rid !== "string" || !rid.trim()) {
        logMessage(
          `Skipping invalid rid for field ${configItem.field_label}: ${JSON.stringify(rid)} (type=${typeof rid})`,
        );
        continue;
      }

      try {
        const mapperObject =
          await this.rdFormMapperSchemaService.getDataMapperObjectByRid(rid.trim());
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
    stateRid?: string | null;
    fiscalYear?: string;
  },
) {
  logMessage(`[TableConfig] Processing config item: ${JSON.stringify(configItem)}`);

  if (!configItem.column_id) {
    logMessage(
      `[TableConfig][WARN] Missing column_id for table item: ${
        configItem.field_label || configItem.field_id
      }`
    );
  }

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
          configItem.column_id
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
        logMessage(
          `[TableConfig] Error parsing column ID list: ${parseError}`
        );
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
            await this.rdFormMapperSchemaService.getDataMapperObjectByRid(val);

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
                context.fiscalYear
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
          const rowEntry = (rows as any[]).find(
            (r: any) => Number(r.row_index) === rowIndex + 1
          ) ?? (rows as any[])[rowIndex];
          const rv = rowEntry?.field_value ?? rowEntry?.value ?? null;
          rowValueMap[rid] = rv !== null && rv !== undefined ? String(rv) : "";
        }

        // Helper: resolve a #ref — first try per-row tableValueCache, then fall back
        // to field_id lookup in enhancedConfigs (for cross-field references like #f3_04[0])
        const resolveTableRef = (rawKey: string): string => {
          const key = rawKey.trim().replace(/[\s,:{}<>]+$/, "").trim();
          // Check per-row cache first (RID-based)
          for (const [rid, val] of Object.entries(rowValueMap)) {
            const mo = mapperObjects[rid];
            if (mo?.field_name === key || rid === key) return JSON.stringify(val);
          }
          // Fall back to field_id match in tableValueCache keys
          if (rowValueMap[key] !== undefined) return JSON.stringify(rowValueMap[key]);
          // Fall back to plain value (will be quoted for string safety)
          return JSON.stringify(key);
        };

        const tokens: string[] = [];
        let hasIfExpression = false;
        let ifExpressionValue = "";

        for (const key of calculationKeys) {
          const val = configItem.calculation_config[key];

          // IF expression — resolve inline using full expression pipeline
          if (
            typeof val === "string" &&
            /\bIF\s*\(|#/.test(val)
          ) {
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
              }
            );

            // Replace #field_id / #label refs — allow spaces in labels (e.g. #Software Development)
            // Uses lookahead to stop at operators, comparisons, block delimiters, or next #
            resolved = resolved.replace(
              /#([^#+*/]+?)(?=\s*[+*\/:<>{}=!]|\s+-\s+(?=[#\d])|\s*,|\s*#|\s*\)|\s*$)/g,
              (_m: string, fieldRef: string) => {
                const cleanRef = fieldRef.trim().replace(/[\s,:{}<>]+$/, "").trim();

                // 1. Look up by field_name in tableValueCache (same-table row-specific value)
                const cachedByField = Object.entries(tableValueCache).find(([rid]) => {
                  return mapperObjects[rid]?.field_name === cleanRef;
                });
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
                const matchedConfigs = enhancedConfigs.filter((cfg: any) =>
                  (cfg.field_id && cfg.field_id === cleanRef) ||
                  (cfg.field_label && cfg.field_label.toLowerCase() === cleanRefLower) ||
                  (cfg.field_name && cfg.field_name.toLowerCase() === cleanRefLower)
                );

                if (matchedConfigs.length > 0) {
                  // If there are multiple matches, this is a Table-Item — get the row-specific one.
                  // Table-Item rows are stored with value_field_id = the PDF field path for that row,
                  // and the label is suffixed [row_N]. Try to find the matching row by row index.
                  const rowSpecific = matchedConfigs.find((cfg: any) => {
                    // Match by row number suffix [row_N] on the label
                    const labelMatch = cfg.label?.match(/\[row_(\d+)\]$/);
                    return labelMatch && parseInt(labelMatch[1], 10) === rowIndex + 1;
                  }) ?? matchedConfigs[0]; // fall back to first if no row suffix

                  const v = rowSpecific.value !== undefined && rowSpecific.value !== null && rowSpecific.value !== ""
                    ? String(rowSpecific.value) : null;
                  if (v === null) return "null";
                  const n = Number(v);
                  return !isNaN(n) ? String(n) : JSON.stringify(v);
                }

                // 3. No match found — treat as a plain string literal for comparison
                //    (e.g. #Software Development in: IF(#f3_04 === #Software Development))
                return JSON.stringify(cleanRef);
              }
            );

            resolved = this.normalizeExpressionSyntax(resolved);
            resolved = this.transformIfExpressions(resolved);

            try {
              // eslint-disable-next-line no-new-func
              const fn = new Function("Math", `"use strict"; return (${resolved});`);
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
              logMessage(`[TableConfig] IF expression eval error for row ${rowNumber}: ${err} | resolved: ${resolved}`);
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
          else if (
            typeof val === "string" &&
            mapperObjects[val]
          ) {
            const rv = rowValueMap[val];
            if (rv === null || rv === undefined || rv === "") {
              tokens.push("0");
            } else {
              const numericValue = Number(rv);
              tokens.push(!isNaN(numericValue) ? String(numericValue) : JSON.stringify(String(rv)));
            }
          }

          // Numeric literal
          else if (
            typeof val === "number" ||
            !isNaN(Number(val))
          ) {
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
            const fn = new Function("Math", `"use strict"; return (${infixExpr});`);
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

        logMessage(
          `[TableConfig] Row ${rowNumber} computed expression: ${infixExpr} = ${computedValue}`
        );

        let finalValue = computedValue;
        // For Table-Item fields: if numeric result is 0, write empty string (PDF blank convention)
        if (finalValue === 0 || finalValue === "0") {
          finalValue = "";
        }
        // Truncate value if maxLength is set
        if (configItem.maxLength && typeof finalValue === 'string' && finalValue.length > configItem.maxLength) {
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
        `[TableConfig] Error computing table config for ${configItem.field_label}:`,
        error
      );
      this.pushEnhancedConfig(enhancedConfigs, configItem, "");
      return;
    }
  }

  // 🔹 Default fallback
  this.pushEnhancedConfig(
    enhancedConfigs,
    configItem,
    configItem.value
  );
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
      const fieldId = configItem.field_id;
      logMessage(`[EnhanceConfig] Processing config item: ${fieldLabel} (field_id=${fieldId})`);
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
         if (fieldLabel === "Total -> Equals Ratio (D) [Col.B/Col.C]" || fieldId === "Equals Ratio D ColBColCE Total from Column D") {
        try {
          // Only sum for the past three years from the fiscal year
          const fiscalYearInt = parseInt(fiscalYear || '0', 10) - 1;
          const years = [fiscalYearInt, fiscalYearInt - 1, fiscalYearInt - 2];
          // Assuming there is a 'year' column in case_history_submission
          const query = rawQueries.getHistoricalSubmissionData(accountRid, stateRid || '', years, schemaName);
          const orgDb = await this.getOrgDb();
          const [result]: any[] = await orgDb.query(query);
          const totalValue = result?.[0]?.total_value ?? 0;
          value = this.roundToTwoDecimals(Number(totalValue));
          logMessage(`Custom sum for field ${fieldLabel} (last 3 years): ${value}`);
          this.pushEnhancedConfig(enhancedConfigs, configItem, value);
        } catch (err) {
          logMessage(`Error in custom sum for field ${fieldLabel} (exception): ${err}`);
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
    const addToValueMap = (rawKey: string, value: any) => {
      if (!rawKey) return;
      valueMap.set(rawKey, value ?? 0);

      const noIndexKey = this.stripIndexes(rawKey);
      valueMap.set(noIndexKey, value ?? 0);

      const normalizedKey = this.normalizeFieldRef(rawKey);
      valueMap.set(normalizedKey, value ?? 0);
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

        if (!normalizedExpression.includes("#")) continue;

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

        // Skip plain text values — only process if value looks like an expression.
        // Plain strings (e.g. "Software Development", "Telecommunications") pass through unchanged.
        // Project codes like "P202-001" are NOT expressions — hyphens with no spaces aren't arithmetic.
        const isExpression = ((): boolean => {
          if (/#|\bIF\s*\(|\bTHEN\b|\bELSE\b|\bMIN\s*\(|\bMAX\s*\(/i.test(expression)) return true;
          if (/[+*/]/.test(expression)) return true;                   // +, *, / are always arithmetic
          if (/\s-\s(?=[#\d])/.test(expression)) return true;         // space-dash-space before ref/digit = binary minus
          if (/^[\d.]+$/.test(expression)) return true;               // pure number
          if (/^[\d.\s+\-*/()]+$/.test(expression)) return true;    // pure arithmetic expression
          if (/^[A-Za-z]\d{3}-[0-9a-fA-F-]{36}$/.test(expression)) return true;  // bare RID
          if (/[A-Za-z]\d{3}-[0-9a-fA-F-]{36}/.test(expression)) return true;    // contains RID
          return false;
        })();
        if (!isExpression) return;

        // Normalize syntax (handles custom IF, label, etc.)
        const normalizedExpression = this.normalizeExpressionSyntax(expression);

        logMessage(
          `Evaluating expression for field value ${item.field_label || item.field_id}: ${expression}`,
        );

        // Defensive: Track resolved values for debugging and type safety
        const resolvedValues: Record<string, { rawValue: any; numeric: number }> = {};

      // TWO-PASS # reference resolution:
      // Pass 1: resolve #RID (exact UUID format e.g. #U001-xxxx-...) — hyphens are part of the key
      // Pass 2: resolve #label (free-text field labels) — stops at operators, not hyphens

      // Strip trailing whitespace/commas/colons from a label key.
      // Also strips unbalanced trailing ) characters (e.g. outer IF/ternary closing paren)
      // while preserving balanced internal parens like '(.15)' or '(.50)'.
      // Returns the cleaned key AND any unbalanced ) suffix to be re-appended after substitution.
      const cleanLabelKey = (rawKey: string): { key: string; suffix: string } => {
        let s = rawKey.trim().replace(/[\s,:{}<>]+$/, "").trim();
        let suffix = "";
        while (s.endsWith(")")) {
          const opens = (s.match(/\(/g) || []).length;
          const closes = (s.match(/\)/g) || []).length;
          if (closes > opens) { suffix = ")" + suffix; s = s.slice(0, -1).trim(); }
          else break;
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

        const lookupKeys = [
          normalizedKey,
          normalizedKey.replace(/\s+/g, ""),
          this.stripIndexes(normalizedKey),
          this.normalizeFieldRef(normalizedKey),
        ];

        for (const key of lookupKeys) {
          if (valueMap.has(key)) {
            const rawValue = valueMap.get(key);
            const num = this.tryParseNumber(rawValue);
            evalCache.set(normalizedKey, rawValue);
            logMessage(
              `Expression reference resolved for field ${item.field_label || item.field_id}: ${normalizedKey} -> ${JSON.stringify(rawValue)}`
            );
            return (num !== null ? String(num) : "0") + suffix;
          }
        }

        logMessage(`Missing expression reference for field ${item.field_label || item.field_id}: ${normalizedKey} - not found in valueMap. Tried keys: ${JSON.stringify(lookupKeys)}`);
        evalCache.set(normalizedKey, null);
        return "0" + suffix;
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
              else if (expr[i] === ")") { depth--; if (depth === 0) break; }
              i++;
            }
            const inner = expr.slice(innerStart, i);
            i++; // consume closing )
            // Split only on ", #" so commas inside label text are preserved
            const args = inner.split(/,\s*(?=#)/);
            const resolvedArgs = args.map(arg => {
              const trimmed = arg.trim();
              return trimmed.startsWith("#")
                ? resolveRef(trimmed.slice(1))
                : trimmed;
            });
            result += "Math." + fnName.toLowerCase() + "(" + resolvedArgs.join(", ") + ")";
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
        (_match: string, rawKey: string) => resolveRef(rawKey)
      );

      // Pass 3: replace remaining #label tokens (free-text — stop at operators or next #)
      // Labels may contain parens like '(.15)' so ( and ) are NOT in the capture exclusion set.
      // Unbalanced trailing ) are stripped in resolveRef and re-appended after substitution.
      // : stops capture for ternary operator context; space-dash-space stops for binary minus.
      replaced = replaced.replace(
        /#([^#+*/]+?)(?=\s*[+*\/:<>{}]|\s+-\s+(?=[#\d])|\s*,|\s*#|\s*$)/g,
        (_match: string, rawKey: string) => resolveRef(rawKey)
      );
      

        // Defensive: Replace bare min/max( with Math.min/max( — skip if already prefixed with Math.
        replaced = replaced
          .replace(/(?<!Math\.)\bmin\s*\(/gi, "Math.min(")
          .replace(/(?<!Math\.)\bmax\s*\(/gi, "Math.max(");
        replaced = this.transformIfExpressions(replaced);

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
          const hadExpressionMarkers = /#|\bIF\s*\(|\bTHEN\b|\bELSE\b|\bMIN\s*\(|\bMAX\s*\(|[+*/]|\s-\s(?=[#\d])/i.test(expression);
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
              const fn = new Function("Math", `"use strict"; return (${expr});`);
              const result = fn(Math);
              if (result === null || result === undefined) return null;
              if (typeof result === "boolean") return result ? 1 : 0;
              if (typeof result === "number" && !Number.isFinite(result)) return 0;
              if (Number.isNaN(result)) return 0;
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
      this.logger.warn(
        `Field "${item.field_label || item.field_id}" could not be resolved after ${maxExpressionPasses} passes. Setting value to null.`,
      );
      item.value = null;
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
      if (
        !isFinancialSignOffDone ||
        !isFinancialSignOffDone.financial_working_signoff
      ) {
        return {
          statusCode: HttpStatus.FAILED,
          message: HttpStatus.FAILED_MESSAGE,
          errorMessage: STATUS_MESSAGE.rdCreditFinancialSignOffPending,
        };
      }

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

  private formatDate(dateStr: string): string {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
          const sasUrl = await generateSasUrl(results.filled_form_url, 3000);
           results.filled_form_url = sasUrl
             ? await this.fetchUrlAsBase64(sasUrl)
             : null;
          // results.filled_form_url = sasUrl
  
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
                  const userEventInfo:any = await this.helperMethod.fetchUserAndEventInfo({
                                                                    userId: data.userId!,
                                                                    eventType: eventTypes.UI_HANDLER
                                                                  });
                   const [caseDetails] : any[] = await orgDb.query(rawQueries.fetchCaseById(schemaName), {replacements : {caseId : data.case_rid}, type : QueryTypes.SELECT})
                  await this.helperMethod.createAccountTimelineEntry(parentAccount[0][0].r_number!, {
                                                              created_by: data.userId!,
                                                              account_rid: data.account_rid,
                                                              entity_rid: data.case_rid!,
                                                              entity_name: entityTypes.RD_FORM,
                                                              created_by_name: userEventInfo.full_name,
                                                              event_type_rid: userEventInfo.event_type_rid,
                                                              event_name: eventNames.SIGNOFF,
                                                              descriptions: caseDetails?.case_name || '',
                                                              case_rid: data.case_rid,
                                                            },["case"]);
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

  private async updateFederalFormError(caseRid: string, countryRid: string, errorMessage: string, orgDb: Sequelize) {
    const query = `UPDATE rd_federal_forms SET form_error_message = ? WHERE case_rid = ? AND country_rid = ?`;
    await orgDb.query(query, { replacements: [errorMessage, caseRid, countryRid] });
  }

  private async updateStateFormError(caseRid: string, stateRid: string, errorMessage: string, orgDb: Sequelize) {
    const query = `UPDATE rd_state_forms SET form_error_message = ? WHERE case_rid = ? AND state_rid = ?`;
    await orgDb.query(query, { replacements: [errorMessage, caseRid, stateRid] });
  }
}