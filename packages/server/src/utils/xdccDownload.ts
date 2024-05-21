import XDCC from "xdccjs";
import { config } from "./config.js";

type StatusOption = "pending" | "downloading" | "downloaded" | "error" | "cancelled";

export interface DownloadableFile {
	channelName: string;
	network: string;
	fileNumber: string;
	botName: string;
	fileSize: string;
	fileName: string;
}

export interface DownloadingFile extends DownloadableFile {
	status: StatusOption;
	percentage: number;
	errorMessage?: string;
}

const clients = new Map<string, XDCC.default>();
const jobs = new Map<string, XDCC.Job>();

const downloads = new Map<string, DownloadingFile>();

const buildJobKey = (file: DownloadableFile) =>
	`${file.network}-${file.channelName}-${file.botName}-${file.fileNumber}-${file.fileName}-${file.fileSize}`;

const isSameFile = (fileInfo: XDCC.FileInfo, fileToDownload: DownloadableFile) =>
	fileInfo.file === fileToDownload.fileName;

const downloadFile = async (xdcc: XDCC.default, fileToDownload: DownloadableFile, jobKey: string) => {
	const job = await xdcc.download(fileToDownload.botName, fileToDownload.fileNumber);
	jobs.set(jobKey, job);

	const downloadData = {
		...fileToDownload,
		percentage: 0,
		status: "pending" as StatusOption,
		errorMessage: undefined as string | undefined,
	};

	downloads.set(jobKey, downloadData);

	job.on("downloading", (fileInfo, _received, percentage) => {
		if (isSameFile(fileInfo, fileToDownload)) {
			downloadData.percentage = percentage;
			downloadData.status = "downloading";
		}
	});

	job.on("downloaded", (fileInfo) => {
		if (isSameFile(fileInfo, fileToDownload)) {
			downloadData.status = "downloaded";
		}
	});

	job.on("error", (error, fileInfo) => {
		if (!fileInfo || isSameFile(fileInfo, fileToDownload)) {
			downloadData.status = "error";
			downloadData.errorMessage = error;
		}
	});

	job.on("cancel", () => {
		downloadData.status = "cancelled";
		jobs.delete(jobKey);
	});

	job.on("done", () => {
		jobs.delete(jobKey);
	});
};

export const download = (fileToDownload: DownloadableFile): Promise<void> => {
	const jobKey = buildJobKey(fileToDownload);

	if (jobs.has(jobKey)) {
		return Promise.resolve();
	}

	if (!clients.has(fileToDownload.network)) {
		const xdcc = new XDCC.default({
			host: fileToDownload.network,
			port: 6667,
			chan: [fileToDownload.channelName],
			nickname: config.nickname,
			username: config.nickname,
			randomizeNick: true,
			path: config.downloadPath,
			verbose: true,
			queue: /.*coda.*/,
		} as XDCC.Params);
		clients.set(fileToDownload.network, xdcc);

		return new Promise<void>((resolve, rejects) => {
			xdcc.on("ready", async () => {
				await downloadFile(xdcc, fileToDownload, jobKey);
				resolve();
			});

			xdcc.on("error", (error) => {
				rejects(error);
			});

			xdcc.on("can-quit", () => {
				xdcc.quit();
				clients.delete(fileToDownload.network);
			});
		});
	}

	const xdcc = clients.get(fileToDownload.network) as XDCC.default;
	return downloadFile(xdcc, fileToDownload, jobKey);
};

export const statuses = () => new Array(...downloads.values());

export const cancel = (fileToCancel: DownloadableFile) => {
	const jobKey = buildJobKey(fileToCancel);

	if (jobs.has(jobKey)) {
		jobs.get(jobKey)?.cancel();
	}

	downloads.delete(jobKey);
};
