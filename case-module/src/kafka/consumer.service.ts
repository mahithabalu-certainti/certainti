import { kafka, ENV } from "../config/kafka";
import StateComputationService from "../services/rdComputation/state.computation.service";
import { logMessage } from "../utils/helpers";
import RDCreditSchemaService from "../services/rdComputation/schemaService";

/**
 * Kafka Consumer Service
 */
export class KafkaConsumerService {
    private rdCreditSchemaService: RDCreditSchemaService;
    private stateComputationService: StateComputationService;

    constructor() {
        this.rdCreditSchemaService = new RDCreditSchemaService();
        this.stateComputationService = new StateComputationService();
    }

    private consumer = kafka.consumer({ groupId: ENV.KAFKA_GROUP_ID });

    async start() {
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

                await this.rdCreditSchemaService.markAsInProgress(payload.accountNumber, payload.processRid);

                await this.stateComputationService.runComputation(
                    payload.accountRid,
                    payload.caseRid,
                    payload.effectiveStart,
                    payload.effectiveEnd
                );

                await this.rdCreditSchemaService.markAsCompleted(payload.accountNumber, payload.processRid);

                console.log(`Computation complete for id=${payload.processRid}`);
            }
        });
    }
}

export const kafkaConsumerService = new KafkaConsumerService();
