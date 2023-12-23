import { FastifyInstance } from "fastify";
import { search } from "../utils/xdccDatabase.js";

export default async function (fastify: FastifyInstance) {

    fastify.get<{ Querystring: { fileName: string } }>('/', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    fileName: {
                        type: 'string'
                    }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            channelName: { type: 'string' },
                            network: { type: 'string' },
                            fileNumber: { type: 'string' },
                            botName: { type: 'string' },
                            fileSize: { type: 'string' },
                            fileName: { type: 'string' },
                        }
                    }
                }
            }
        }
    }, (request) => {
        const { fileName } = request.query

        return search(fileName)
    })
}