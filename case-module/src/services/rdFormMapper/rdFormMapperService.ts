import { or, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import RdFormMapperSchemaService from "./schemaService";
import { generateSasUrl, logMessage, uploadBufferToAzureBlob } from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { calculateFiscalYearDateRange } from "../../utils/dateFunction.utils";
import { Kafka, Producer } from "kafkajs";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
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
  ): Promise<void> {
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

      // Collect PDF data in memory
      doc.on('data', buffers.push.bind(buffers));
      
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
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const finalBuffer = Buffer.concat(buffers);
          resolve(finalBuffer);
        });
        doc.on('error', reject);
        setTimeout(() => reject(new Error("PDF generation timeout")), 30000);
      });
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
  private async enhanceMapperConfigWithDynamicValues(
    mapperConfig: any[],
    accountRid: string,
    effectiveStart: string,
    caseRid: string,
    schemaName: string,
    fiscalYear?: string,
  ): Promise<any[]> {
    const enhancedConfigs: any[] = [];

    for (const configItem of mapperConfig) {
      let value = configItem.value;
      if (
        configItem.calculation_config &&
        configItem.field_type == "line-item"
      ) {
        for (const key in configItem.calculation_config) {
          const rid = configItem.calculation_config[key];

          try {
            const mapperObject =
              await this.rdFormMapperSchemaService.getDataMapperObjectByRid(
                rid,
              );
            if (mapperObject?.ref_table && mapperObject?.field_name) {
              const dynamicValue =
                await this.rdFormMapperSchemaService.fetchFieldValueFromRefTable(
                  mapperObject.ref_table,
                  mapperObject.field_name,
                  mapperObject.is_json,
                  accountRid,
                  caseRid,
                  schemaName,
                );

              if (dynamicValue !== null) {
                value = dynamicValue;
                logMessage(
                  `Fetched dynamic value for field ${configItem.field_label}: ${dynamicValue}`,
                );
              }
            }
          } catch (error) {
            this.logger.error(
              `Error fetching dynamic value for ${configItem.field_label}:`,
              error,
            );
          }
        }

        // Add the single enhanced config item
        enhancedConfigs.push({
          ...configItem,
          label: configItem.field_label,
          value_field_id: configItem.field_id,
          value,
        });
      } else if (configItem.field_type == "table") {
        // Fetch column ID list from data_mapper_table_mappings for table field types
        if (configItem.column_id && configItem.calculation_config) {
          try {
            // Get mapper object from calculation config (same as line-item)
            let mapperObject: any = null;
            for (const key in configItem.calculation_config) {
              const rid = configItem.calculation_config[key];
              mapperObject =
                await this.rdFormMapperSchemaService.getDataMapperObjectByRid(
                  rid,
                );
              break; // Use first calculation config entry
            }

            // Get column ID list from data_mapper_table_mappings using the column_id
            const columnIdList =
              await this.rdFormMapperSchemaService.getColumnIdListFromTableMappings(
                configItem.column_id,
              );

            if (
              columnIdList &&
              mapperObject?.ref_table &&
              mapperObject?.field_name
            ) {
              // Check if columnIdList is a JSON object with row mappings
              let fieldMappings: any = {};

              try {
                // If it's a string, try to parse it as JSON
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
                  `Error parsing column ID list as JSON: ${parseError}`,
                );
                fieldMappings = {};
              }

              // Handle JSON object field mappings (new format)
              if (Object.keys(fieldMappings).length > 0) {
                // Fetch table data
                const tableValues =
                  await this.rdFormMapperSchemaService.fetchTableValues(
                    mapperObject.ref_table,
                    mapperObject.field_name,
                    mapperObject.is_json || false,
                    accountRid,
                    caseRid,
                    schemaName,
                    fiscalYear,
                  );

                // Create individual field entries for each table row
                Object.entries(fieldMappings).forEach(
                  ([rowNumber, fieldPath]) => {
                    if (typeof fieldPath === "string") {
                      const rowIndex = parseInt(rowNumber) - 1; // Convert 1-based to 0-based
                      const rowValue = tableValues[rowIndex]?.value || "";
                      enhancedConfigs.push({
                        ...configItem,
                        label: `${configItem.field_label}_row_${rowNumber}`,
                        field_name: configItem.field_name, // Keep original field_name
                        value_field_id: fieldPath, // Use PDF field path as value_field_id
                        value: rowValue,
                      });
                    }
                  },
                );

                logMessage(
                  `Created ${Object.keys(fieldMappings).length} table row mappings for field ${configItem.field_label}`,
                );
              } else {
                // Fallback for legacy or empty mappings
                enhancedConfigs.push({
                  ...configItem,
                  label: configItem.field_label,
                  value_field_id: configItem.field_id,
                  value: "",
                });
              }
            } else {
              // No valid mappings found
              enhancedConfigs.push({
                ...configItem,
                label: configItem.field_label,
                value_field_id: configItem.field_id,
                value: "",
              });
            }
          } catch (error) {
            this.logger.error(
              `Error fetching table values for ${configItem.field_label}:`,
              error,
            );
            enhancedConfigs.push({
              ...configItem,
              label: configItem.field_label,
              value_field_id: configItem.field_id,
              value: "",
            });
          }
        } else {
          // No column_id or calculation_config
          enhancedConfigs.push({
            ...configItem,
            label: configItem.field_label,
            value_field_id: configItem.field_id,
            value: configItem.value,
          });
        }
      } else {
        // Default case for other field types
        enhancedConfigs.push({
          ...configItem,
          label: configItem.field_label,
          value_field_id: configItem.field_id,
          value,
        });
      }
    }
    return enhancedConfigs;
  }

  async processRdFormMapperRequests(message: any): Promise<any[]> {
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
      const configLevelKey =
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
          await this.processFederalForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            schemaName,
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
          );
        },
        [ConfigType.FEDERAL_ONLY]: async () => {
          logMessage("Processing Federal forms only.");
          await this.processFederalForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            schemaName,
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

      await executeComputation();
      logMessage(
        `Successfully completed form mapper processing for case: ${caseRid}`,
      );

      return [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : err;
      logMessage(`Error processing RD Mapper requests: ${errorMessage}`);
      return [];
    }
  }

  async initiateRDFormFillerProcess(
    accountRid: string,
    caseRid: string,
    fiscalYear: number,
  ) {
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
      if (!isFinancialSignOffDone[0].financial_working_signoff) {
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
      return await this.initiateRDFormFiller(
        accountRid,
        caseRid,
        effectiveStart,
        effectiveEnd,
        schemaName,
        fetchParentAccountRnumber[0][0].r_number,
      );
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
  }) {
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
      if (results?.filled_form_url != null) {
        results.filled_form_url =
          (await generateSasUrl(results.filled_form_url, 300)) || null;
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
