import { or, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import { initOrgSequelize } from "../../config/orgDataSource";
import { Logger } from "winston";
import { CaseModelService } from "../caseModelsService";
import RdFormMapperSchemaService from "./schemaService";
import axios from "axios";
import { generateSasUrl, logMessage } from "../../utils/helpers";
import { pdfFiller } from "../../utils/pdfFiller";
import { HttpStatus, rawQueries, STATUS_MESSAGE } from "../../utils/constants";
import RDCreditSchemaService from "../rdComputation/schemaService";
import { calculateFiscalYearDateRange } from "../../utils/dateFunction.utils";
import { kafkaProducerService } from "../../kafka/producer.service";
import { Kafka, Producer } from "kafkajs";

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
  ): Promise<void> {
    logMessage("Processing Federal form computation.");

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
      );

    const filledFormUrl = await pdfFiller(
      enhancedMapperConfig,
      accountRid,
      formInfo.browse_file,
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
   * Enhance mapper configuration with dynamic values from reference tables
   */
  private async enhanceMapperConfigWithDynamicValues(
    mapperConfig: any[],
    accountRid: string,
    effectiveStart: string,
    caseRid: string,
  ): Promise<any[]> {
    return Promise.all(
      mapperConfig.map(async (configItem: any) => {
        let value = configItem.value;

        if (configItem.calculation_config) {
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
        }

        return {
          ...configItem,
          label: configItem.field_label,
          value_field_id: configItem.field_id,
          value,
        };
      }),
    );
  }

  async processRdFormMapperRequests(message: any): Promise<any[]> {
    try {
      // TODO: Remove hardcoded test data before production
      message = {
        country_rid: "D001-5f058151-3b57-4f75-9f45-243a1f7aeb19",
        caseRid: "D001-a761961f-4890-4c22-a585-3e74a8b98770",
        accountRid: "D001-30cae4e8-b8c1-41fc-967a-6a6fb0a47597",
        effectiveStart: "2025-04-01",
        effectiveEnd: "2026-03-31",
        accountNumber: "ACC-00891",
        schemaName:"trd365_00890"
      };

      const parsedMessage =
        typeof message === "string" ? JSON.parse(message) : message;

      const {
        caseRid,
        accountRid,
        effectiveStart,
        effectiveEnd,
        accountNumber,
        schemaName
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
          );
          /*   await this.processStateForms(
            accountRid,
            caseRid,
            fetchAccountCountryId[0].country_rid,
            effectiveStart,
            effectiveEnd,
            accountNumber,
            mainDb,
            orgDb,
            availableConfig.states || [],
          ); */
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
        fetchParentAccountRnumber[0][0].r_number
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
        clientId: process.env.KAFKA_CLIENT_ID_RD_FORM || "rd-form-filler-service",
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
    accountNumber: string
  ) {
    try {
      const processRid = await this.rdCreditSchemaService.markAsInitiated(
        schemaName,
        caseRid,
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
      logMessage(`RD Form Filler process initiated. Kafka send result: ${JSON.stringify(sendResult)}`);
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

  async getRdFormUrl(
    value: {
      account_rid: string;
      case_rid: string;
      fiscal_year: number;
      is_federal: boolean;
      country_rid: string;
      state_rid?: string;
    }
  ) {
    try {
      // Validate input parameters
      if (!value.is_federal && !value.state_rid) {
        return this.createErrorResponse(
          STATUS_MESSAGE.detailFetchedFailed,
          'State RID is required for non-federal forms'
        );
      }

      const [mainDb, orgDb] = await Promise.all([
        this.getMainDb(),
        this.getOrgDb()
      ]);

      const fetchParentAccountRnumber: any = await mainDb.query(
        await rawQueries.fetchParentAccount(value.account_rid, mainDb)
      );

      const accountNumber = fetchParentAccountRnumber[0]?.[0]?.r_number;
      if (!accountNumber) {
        return this.createErrorResponse(
          STATUS_MESSAGE.detailFetchedFailed,
          'Parent account not found'
        );
      }

      const results: { filled_form_url?: string | null; form_error_message?: string | null } | null = value.is_federal
        ? await this.rdFormMapperSchemaService.getFederalFormUrl(
            value.case_rid,
            value.country_rid,
            orgDb,
            accountNumber
          )
        : await this.rdFormMapperSchemaService.getStateFormUrl(
            value.case_rid,
            value.state_rid!,
            orgDb,
            accountNumber
          );
        if(results?.filled_form_url != null){
         results.filled_form_url =  await generateSasUrl(results.filled_form_url,300) || null;
        }

      return this.createSuccessResponse({
        rdformUrl: results?.filled_form_url || null,
        rdErrorMessage: results?.form_error_message || null
      });

    } catch (error) {
      logMessage(`Error fetching RD Form URL: ${error}`);
      return this.createErrorResponse(
        STATUS_MESSAGE.jurisdictionFetchedFailed,
        error instanceof Error ? error.message : String(error)
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
