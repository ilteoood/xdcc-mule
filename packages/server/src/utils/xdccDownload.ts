import XDCC from "xdccjs"
import { config } from "./config.js"

type StatusOption = 'pending' | 'downloading' | 'downloaded' | 'error' | 'cancelled'

export interface DownloadableFile {
    channelName: string,
    network: string,
    fileNumber: string,
    botName: string,
    fileSize: string,
    fileName: string,
}

export interface DownloadingFile extends DownloadableFile {
    status: StatusOption
    percentage: number
    errorMessage?: string
}

const clients = new Map<string, XDCC.default>()
const jobs = new Map<string, XDCC.Job>()

const downloads = new Map<string, DownloadingFile>()

const buildJobKey = (file: DownloadableFile) => `${file.network}-${file.channelName}-${file.botName}-${file.fileNumber}-${file.fileName}-${file.fileSize}`

export const download = (fileToDownload: DownloadableFile) => {
    const jobKey = buildJobKey(fileToDownload)

    if(jobs.has(jobKey)) {
        return
    }

    if (!clients.has(fileToDownload.network)) {
        clients.set(fileToDownload.network, new XDCC.default({
            host: fileToDownload.network,
            port: 6667,
            chan: [fileToDownload.channelName],
            nickname: config.nickname,
            randomizeNick: true,
            path: config.downloadPath,
            verbose: true,
            queue: /.*coda.*/
        } as XDCC.Params))
    }

    const xdcc = clients.get(fileToDownload.network)

    return new Promise<void>((resolve, rejects) => {
        xdcc.on('ready', async () => {
            const job = await xdcc.download(fileToDownload.botName, fileToDownload.fileNumber)
            jobs.set(jobKey, job)

            const downloadData = { ...fileToDownload, percentage: 0, status: 'pending' as StatusOption, errorMessage: undefined }

            downloads.set(jobKey, downloadData)

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

        xdcc.on('error', (error) => { rejects(error) })

        xdcc.on('can-quit', () => {
            xdcc.quit()
            clients.delete(fileToDownload.network)
        })
    })
}

export const statuses = () => new Array(...downloads.values())

export const cancel = (fileToCancel: DownloadableFile) => {
    const jobKey = buildJobKey(fileToCancel)

    if (jobs.has(jobKey)) {
        jobs.get(jobKey).cancel()
    }

    downloads.delete(jobKey)
}