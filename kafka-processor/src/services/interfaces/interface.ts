export interface IAIAssessmentService {
  disconnectProducer(): Promise<void>;
  sendAIResponseToTopic(
    aiResponse: any
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: string;
  }>;
  processKafkaMessage(data: any): Promise<void>;
}