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
const jobs = new Map<string, XDCC.Job>()

const downloads = []

const buildJobKey = (file: DownloadableFile) => `${file.network}-${file.channelName}-${file.botName}-${file.fileNumber}-${file.fileName}-${file.fileSize}`

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
            const jobKey = buildJobKey(fileToDownload)

            const job = await xdcc.download(fileToDownload.botName, fileToDownload.fileNumber)
            jobs.set(jobKey, job)

            const downloadData = { ...fileToDownload, percentage: 0, status: 'pending', errorMessage: undefined }

            downloads.push(downloadData)

            job.on('downloading', (_fileInfo, _received, percentage) => {
                downloadData.percentage = percentage
                downloadData.status = 'downloading'
            })

            job.on('downloaded', () => {
                downloadData.status = 'downloaded'
                jobs.delete(jobKey)
            })

            job.on('error', (error) => {
                downloadData.status = 'error'
                downloadData.errorMessage = error
                jobs.delete(jobKey)
            })

            job.on('cancel', () => {
                downloadData.status = 'cancelled'
                jobs.delete(jobKey)
            })

            resolve()
        })

        xdcc.on('error', (error) => { rejects(undefined, error.message) })
    })
}

export const statuses = () => downloads

export const cancel = (fileToCancel: DownloadableFile) => {
    const jobKey = buildJobKey(fileToCancel)

    const jobExists = jobs.has(jobKey)

    if(jobExists) {
        jobs.get(jobKey).cancel()
        return true
    }

    return jobExists
}