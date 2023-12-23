import XDCC from "xdccjs"

export type DownloadableFile = {
    channelName: string,
    network: string,
    fileNumber: string,
    botName: string,
    fileSize: string,
    fileName: string,
}

export const download = (fileToDownload: DownloadableFile) => {
    const xdcc = new XDCC.default({
        host: fileToDownload.network,
        port: 6667,
        chan: [fileToDownload.channelName],
        nickname: 'iLPaolo',
        randomizeNick: true,
        path: './',
        verbose: true,
        queue: /.*coda.*/
    } as XDCC.Params)

    return new Promise<void>((resolve) => {
        xdcc.on('ready', () => {
            xdcc.download(fileToDownload.botName, fileToDownload.fileNumber)

            resolve()
        })
    })
}