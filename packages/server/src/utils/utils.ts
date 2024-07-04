export interface DownloadableFile {
    channelName: string;
    network: string;
    fileNumber: string;
    botName: string;
    fileSize: string;
    fileName: string;
}

export type StatusOption = "pending" | "downloading" | "downloaded" | "error" | "cancelled";

export interface DownloadingFile extends DownloadableFile {
    status: StatusOption;
    percentage: number;
    errorMessage?: string;
}

export const buildJobKey = <T extends DownloadableFile>(file: T) =>
    `${file.network}-${file.channelName}-${file.botName}-${file.fileNumber}-${file.fileName}-${file.fileSize}`;

export const addJobKey = <T extends DownloadableFile>(file: T) => ({
    ...file,
    id: buildJobKey(file),
})