export interface DownloadableFile {
    channelName: string,
    network: string,
    fileNumber: string,
    botName: string,
    fileSize: string,
    fileName: string,
}

export const statusOptions = ['pending', 'downloading', 'downloaded', 'error', 'cancelled']

export const downloadFile = (file: DownloadableFile) => {
    return fetch(`/api/download`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(file)
    })
}

export const cancelDownload = (file: DownloadableFile) => {
    return fetch(`/api/download`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(file)
    })
}

export const getDownloads = (): Promise<DownloadableFile[]> => {
    return fetch(`/api/downloads`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}