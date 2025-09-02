import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
// import './services/cronJob/renewSubscriptions';
// import initGraphQLServer from "./servers/graphqlServer";

import { Kafka } from "kafkajs";
import interactionsController from "./controllers/interactionsController";
const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {
    const { app } = await initExpressServer();
    // const { graphqlPath } = await initGraphQLServer(app);

    app.listen(PORT, () => {
      // console.log(`Graphql Server ready at: ${graphqlPath}`);
      console.log(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    console.log("Error starting server", err.message);
  }
}

const kafka = new Kafka({
  clientId: "my-app",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"], // update with your broker address
});
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP || "interaction-group" });
async function startKafkaConsumer() {
  try {
    await consumer.connect();
    const topic = process.env.KAFKA_AI_RESPONSE_TRIGGER_TOPIC || 'ai_assessment_response';
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log(
            `Received message from ${topic}[${partition}] @ offset ${message.offset}:`,
            message.value?.toString()
          );
          interactionsController.processKafkaMessages(message.value?.toString());
        } catch (err) {
          console.error("Error processing message:", err);
        }
      },
    });
  } catch (err: any) {
    console.log("Kafka consumer could not be started:", err.message);
  }
}




startServer();
startKafkaConsumer();
