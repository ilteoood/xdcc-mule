export type StatusOption = 'pending' | 'downloading' | 'downloaded' | 'error' | 'cancelled'

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

export const statusOptions: StatusOption[] = ['pending', 'downloading', 'downloaded', 'error', 'cancelled']

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

export const getDownloads = (): Promise<DownloadingFile[]> => {
    return fetch(`/api/downloads`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}