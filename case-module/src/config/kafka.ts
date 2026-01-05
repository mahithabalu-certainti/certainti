import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "rd-credit-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(",")
});


export const ENV = {
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "rd-credit-service",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "rd-credit-consumers",
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || "rd_credit_process_topic"
};