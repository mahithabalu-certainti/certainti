import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
import { Kafka } from "kafkajs";
import aiAssessmentController from "./controllers/aiAssessmentController";
// import initGraphQLServer from "./servers/graphqlServer";

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
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"], // update with your broker address
});
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_CONSUMER_GROUP || "interaction-group",
});
async function startKafkaConsumer() {
  await consumer.connect();
  const topic = process.env.KAFKA_TOPIC_INTERACTION || "ai_assessment_request";
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }: { message: any }) => {
      console.log("Received message:", message.value?.toString());
      await aiAssessmentController.processKafkaMessages(
        message.value?.toString()
      );
    },
  });
}
startServer();
startKafkaConsumer();
import configurations from "./config/config";
const services = configurations.getInstance().getServices();
const aiAssessmentService = services.aiAssessmentService;

process.on("SIGINT", async () => {
  await aiAssessmentService.disconnectProducer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await aiAssessmentService.disconnectProducer();
  process.exit(0);
});
