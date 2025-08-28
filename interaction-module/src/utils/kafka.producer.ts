import {Kafka, Producer} from 'kafkajs'
import { HttpStatus, interactionTypes, STATUS_MESSAGE } from './constants';
import {v4 as uuidV4} from 'uuid'
import { Response } from 'express';

let producer : Producer | null = null 

export const producerConfig : Record<string, any> = {
    clientId : process.env.KAFKA_CLIENT_ID!,
    brokers : [process.env.BROKERS],
    topic : process.env.PRODUCER_TOPIC!
}

const kafka = new Kafka({
    clientId : producerConfig.clientId,
    brokers : producerConfig.brokers
})
async function getProducer() {
    if(!producer) {
        producer = kafka.producer({
            allowAutoTopicCreation : false
        })
        await producer.connect()
        console.log("Producer connected successfully")
    }
    return producer
}

async function postRequestToKafka (data : any) : Promise<any> {
    const producer = await getProducer();
    let result = await producer.send({
        topic : producerConfig.topic,
        messages : [{
            value : JSON.stringify(data)
        }]
    })
    if(result.length > 0) {
        console.log("Message produced successfully : ",result)
        return {
            statusCodeValue : HttpStatus.SUCCESS_MESSAGE,
            statusMessage : STATUS_MESSAGE.assessmentInitiated
        }
    }
}

export default postRequestToKafka