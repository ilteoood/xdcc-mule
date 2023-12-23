import { FastifyInstance } from "fastify";
import { DownloadableFile, download } from "../utils/xdccDownload.js";

export default async function (fastify: FastifyInstance) {
    fastify.get('/', () => {

    })

    fastify.post<{ Body: DownloadableFile }>('/', {
        schema: {
            body: {
                channelName: { type: 'string' },
                network: { type: 'string' },
                fileNumber: { type: 'string' },
                botName: { type: 'string' },
                fileSize: { type: 'string' },
                fileName: { type: 'string' },
            },
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