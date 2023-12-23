import { rejects } from "assert"
import XDCC from "xdccjs"

export type DownloadableFile = {
    channelName: string,
    network: string,
    fileNumber: string,
    botName: string,
    fileSize: string,
    fileName: string,
}

const clients = new Map<string, XDCC.default>()

const downloads = []

export const download = (fileToDownload: DownloadableFile) => {
    if (!clients.has(fileToDownload.network)) {
        clients.set(fileToDownload.network, new XDCC.default({
            host: fileToDownload.network,
            port: 6667,
            chan: [fileToDownload.channelName],
            nickname: 'iLPaolo',
            randomizeNick: true,
            path: './',
            verbose: true,
            queue: /.*coda.*/
        } as XDCC.Params))
    }

    const xdcc = clients.get(fileToDownload.network)

    return new Promise<void>((resolve) => {
        xdcc.on('ready', async () => {
            const job = await xdcc.download(fileToDownload.botName, fileToDownload.fileNumber)

            const downloadData = { ...fileToDownload, percentage: 0, status: 'pending', errorMessage: undefined }

            downloads.push(downloadData)

            job.on('downloading', (_fileInfo, _received, percentage) => {
                downloadData.percentage = percentage
                downloadData.status = 'downloading'
            })

            job.on('downloaded', () => {
                downloadData.status = 'downloaded'
            })

            job.on('done', () => {
                downloadData.status = 'done'
            })

            job.on('error', (error) => {
                downloadData.status = 'error'
                downloadData.errorMessage = error
            })

            resolve()
        })

        xdcc.on('error', (error) => { rejects(undefined, error.message) })
    })
}

export const statuses = () => downloads