import {Consumer, Kafka} from 'kafkajs'
import { producerConfig } from './kafka.producer'

const kafka = new Kafka({
    clientId : producerConfig.clientId,
    brokers : producerConfig.brokers
})

let consumer : Consumer | null = null

async function getConsumers() {
    if(!consumer) {
        consumer = kafka.consumer({
            groupId : process.env.GROUP_ID!,
        })
        console.log("Consumer connected successfully")
    }
    return consumer;
}

export default async function fetchAndTriggerAI () {
    const consumer = await getConsumers()
    await consumer.connect()
    await consumer.subscribe({
        topic : process.env.PRODUCER_TOPIC!,
        fromBeginning : true
    })

    await consumer.run({
        eachMessage : async ({topic, partition, message}) => {
            console.log("Received Messages : ", {
                topic : topic,
                message : message.value?.toString()
            })
        }
    })

}