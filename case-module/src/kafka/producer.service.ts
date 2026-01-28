import { kafka, ENV } from "../config/kafka";

/**
 * Kafka Producer Service
 */
export class KafkaProducerService {

    private producer = kafka.producer();
    private admin = kafka.admin();

    async connect() {
        await this.producer.connect();
        console.log("Kafka Producer Connected");
        await this.createTopics();
    }

    async createTopics() {
        try {
            await this.admin.connect();
            const topics = await this.admin.listTopics();
            if (!topics.includes(ENV.KAFKA_DATA_MAPPER_TOPIC)) {
                await this.admin.createTopics({
                    topics: [{
                        topic: ENV.KAFKA_DATA_MAPPER_TOPIC,
                        numPartitions: 1,
                        replicationFactor: 1
                    }]
                });
                console.log(`Topic ${ENV.KAFKA_DATA_MAPPER_TOPIC} created`);
            }
            await this.admin.disconnect();
        } catch (error) {
            console.error("Error creating topics", error);
        }
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
