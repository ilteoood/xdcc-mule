import { FastifyInstance } from "fastify";
import { DownloadableFile, download, statuses } from "../utils/xdccDownload.js";

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
    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ...downloadableFileSchema.properties,
                            status: { type: 'string' },
                            percentage: { type: 'number' },
                            errorMessage: { type: 'string' },
                        }
                    }
                }
            }
        }
    }, statuses)

    fastify.post<{ Body: DownloadableFile }>('/', {
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