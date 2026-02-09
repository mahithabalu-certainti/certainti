import dotenv from "dotenv";
dotenv.config();
import initExpressServer from "./servers/expressServer";
import initGraphQLServer from "./servers/graphqlServer";
import { logMessage } from "./utils/helpers";
import { kafkaProducerService } from "./kafka/producerService";
import { kafkaConsumerService } from "./kafka/consumerService";

const PORT = process.env.SERVER_PORT || 3000;

async function startServer() {
  try {

    // 1. Start Kafka producer
    await kafkaProducerService.connect();
    logMessage("Kafka Producer Connected");

    // 2. Start Kafka consumer
    await kafkaConsumerService.start();
    logMessage("Kafka Consumer Started");

    const { app } = await initExpressServer();
    const { graphqlPath } = await initGraphQLServer(app);

    app.listen(PORT, () => {
      logMessage(`GraphQL Server ready at: ${graphqlPath}`);
      logMessage(`Server running on port : ${PORT}`);
    });
  } catch (err: any) {
    logMessage(`Error starting server: ${err.message}`);
  }
}

startServer();
