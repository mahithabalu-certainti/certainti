import { kafka, ENV } from "../config/kafka";
import StateComputationService from "../services/rdComputation/state.computation.service";
import { logMessage } from "../utils/helpers";
import RDCreditSchemaService from "../services/rdComputation/schemaService";
import { ChildCaseService } from "../services/cases/childCaseService";
import Configurations from "../config/config"

/**
 * Kafka Consumer Service
 */
export class KafkaConsumerService {
    private rdCreditSchemaService: RDCreditSchemaService;
    private stateComputationService: StateComputationService;
    private childCaseService : ChildCaseService
    private rdFormMapperService: any;

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
        this.stateComputationService = new StateComputationService();
        // Dynamically import the rdFormMapperService from Configurations
        const Configurations = require("../config/config").default;
        const Services = Configurations.getInstance().getServices();
        const logger = Configurations.getInstance().getLogger()
        this.rdFormMapperService = Services.rdFormMapperService;
        this.childCaseService = new ChildCaseService(logger)
    }

    private consumer = kafka.consumer({ groupId: ENV.KAFKA_GROUP_ID });
    private formConsumer = kafka.consumer({ groupId: ENV.KAFKA_FORM_GROUP_ID });
    private dossierConsumer = kafka.consumer({groupId : ENV.DOSSIER_GROUP_ID, sessionTimeout: 60000, heartbeatInterval: 5000})

    async start() {
        // Start original consumer
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: ENV.KAFKA_TOPIC, fromBeginning: false });

        logMessage("Kafka Consumer Ready");

        await this.consumer.run({
            eachMessage: async ({ message }) => {
                const key = message.key?.toString();
                const value = message.value!?.toString();
                const payload = JSON.parse(value);

                if (!key) return;

                console.log(`Processing consumer message for id=${JSON.stringify(payload)}`);

                await this.rdCreditSchemaService.markAsInProgress(payload.accountNumber, payload.processRid, 'financial_computation');

                await this.stateComputationService.runComputation(
                    payload.accountRid,
                    payload.caseRid,
                    payload.effectiveStart,
                    payload.effectiveEnd
                );

                await this.rdCreditSchemaService.markAsCompleted(payload.accountNumber, payload.processRid, 'financial_computation');

                console.log(`Computation complete for id=${payload.processRid}`);
            }
        });

        // Start form consumer for rd form filler
        const FORM_TOPIC = ENV.KAFKA_FORM_TOPIC || "rd_form_mapper_processing";
        await this.formConsumer.connect();
        await this.formConsumer.subscribe({ topic: FORM_TOPIC, fromBeginning: false });
        logMessage("Kafka Form Consumer Ready");

        await this.formConsumer.run({
            eachMessage: async ({ message }) => {
                const value = message.value!?.toString();
                if (!value) return;
                let payload;
                try {
                    payload = JSON.parse(value);
                } catch (e) {
                    console.error("Invalid JSON in form topic message", value);
                    return;
                }
                console.log(`Processing form topic message: ${JSON.stringify(payload)}`);
                try {
                    await this.rdCreditSchemaService.markAsInProgress(payload.accountNumber, payload.processRid, 'rd_form');
                    await this.rdFormMapperService.processRdFormMapperRequests(payload);
                    await this.rdCreditSchemaService.markAsCompleted(payload.accountNumber, payload.processRid,'rd_form');
                    console.log("Form processing complete");
                } catch (err) {
                    console.error("Error processing form message", err);
                }
            }
        });

        const dossierTopic = ENV.DOSSIER_KAFKA_TOPIC || "create-dossier-form";
        await this.dossierConsumer.connect();
        await this.dossierConsumer.subscribe({topic : dossierTopic, fromBeginning : false});
        logMessage("Kafka Dossier Form Consumer Ready");

        await this.dossierConsumer.run({
            eachMessage : async ({message}) => {
                 console.log("Dossier consumer message received");
                const key = message.key?.toString();
                const value = message.value?.toString();
                if(!key) {
                    console.log("Skipping message: no key");
                    return;
                }
                if(!value) {
                    console.log("Skipping message: no value");
                    return;
                }
                let payload;
                try {
                    payload = JSON.parse(value);
                } catch (e) {
                    console.error("Invalid JSON in form topic message", value);
                    return;
                }
                console.log(`Processing dossier topic message: ${JSON.stringify(payload)}`); // <-- updated log
                try {

                    const markInProgress = await this.rdCreditSchemaService.markAsInProgress(payload.accountNumber, key, 'dossier-form');
                    await this.childCaseService.processDossierForm(payload.accountNumber, payload.caseRid, payload.accountRid, payload.userId, key);
                    await this.rdCreditSchemaService.markAsCompleted(payload.accountNumber, key,'dossier-form');
                    console.log(`Dossier processing complete for ID: ${key}`);
                } catch (error) {
                    console.error("Error processing dossier message", error);
                }
            }
        })
    }
}

export const kafkaConsumerService = new KafkaConsumerService();
