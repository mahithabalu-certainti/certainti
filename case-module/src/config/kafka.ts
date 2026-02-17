import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "rd-credit-service",
  brokers: (process.env.KAFKA_BROKER || "localhost:9092").split(",")
});


export const ENV = {
  KAFKA_BROKER: (process.env.KAFKA_BROKER || "localhost:9092").split(","),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "rd-credit-service",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "rd-credit-consumers",
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || "rd_credit_processing",
  KAFKA_FORM_TOPIC: process.env.KAFKA_FORM_TOPIC || "rd_form_mapper_processing",
  KAFKA_FORM_GROUP_ID: process.env.KAFKA_FORM_GROUP_ID || "rd-form-mapper-consumers",
  KAFKA_FORM_CLIENT_ID: process.env.KAFKA_FORM_CLIENT_ID || "rd-form-mapper-service",
  KAFKA_DATA_MAPPER_TOPIC: process.env.KAFKA_DATA_MAPPER_TOPIC || "data_mapper_request",
  DOSSIER_KAFKA_TOPIC: process.env.DOSSIER_KAFKA_TOPIC || "create-dossier-form",
  DOSSIER_CLIENT_ID : process.env.DOSSIER_CLIENT_ID || "dossier-form",
  DOSSIER_GROUP_ID : process.env.DOSSIER_GROUP_ID || "dossier-form-consumers"
};