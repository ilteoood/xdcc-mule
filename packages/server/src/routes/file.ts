import { FastifyInstance } from "fastify";
import { searchInDatabase } from "../utils/database";

export default async function (fastify: FastifyInstance) {

    fastify.get<{Querystring: { fileName: string }}>('/', {
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
                            serverName: { type: 'string' },
                            network: { type: 'string' },
                            fileNumber: { type: 'string' },
                            channelName: { type: 'string' },
                            fileSize: { type: 'string' },
                            fileName: { type: 'string' },
                        }
                    }
                }
            }
        }
    }, (request) => {
        const { fileName } = request.query

        return searchInDatabase(fileName)
    })

}