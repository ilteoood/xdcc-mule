import { FastifyInstance } from "fastify";
import { search } from "../utils/xdccDatabase.js";
import { DownloadableFile, download } from "../utils/xdccDownload.js";

const downloadableFileSchema = {
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
                    items: downloadableFileSchema
                }
            }
        }
    }, (request) => {
        const { fileName } = request.query

        return search(fileName)
    })

    fastify.post<{Body: DownloadableFile}>('/', {
        schema: {
            body: downloadableFileSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        downloadId: { type: 'string' }
                    }
                }
            }
        }
    }, async (request) => {
        const fileRequest = request.body

        await download(fileRequest);
    })

}