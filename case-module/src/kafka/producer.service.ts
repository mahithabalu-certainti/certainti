import { kafka, ENV } from "../config/kafka";

/**
 * Kafka Producer Service
 */
export class KafkaProducerService {
    private producer = kafka.producer();

    async connect() {
        await this.producer.connect();
        console.log("Kafka Producer Connected");
    }

    async publish(accountRid: String, accountNumber: String, processRid: string, caseRid: string, effectiveStart: string, effectiveEnd: string) {
        await this.producer.send({
            topic: ENV.KAFKA_TOPIC,
            messages: [{ key: processRid, value: JSON.stringify({ processRid, accountRid, accountNumber, caseRid, effectiveStart, effectiveEnd }) }],
        });
        console.log(`Message published for id=${processRid}`);
    }

    async disconnect() {
        await this.producer.disconnect();
    }
}

export const kafkaProducerService = new KafkaProducerService();
