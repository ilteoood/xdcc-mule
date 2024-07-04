export type StatusOption = "pending" | "downloading" | "downloaded" | "error" | "cancelled";

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
	eta: number;
}

export const statusOptions: StatusOption[] = ["pending", "downloading", "downloaded", "error", "cancelled"];

const ENDPOINT = "/api/downloads";

const JSON_RESPONSE = {
	"Content-Type": "application/json",
};

export const downloadFile = (file: DownloadableFile) => {
	return fetch(ENDPOINT, {
		method: "POST",
		headers: JSON_RESPONSE,
		body: JSON.stringify(file),
	});
};

export const cancelDownload = (file: DownloadableFile) => {
	return fetch(ENDPOINT, {
		method: "DELETE",
		headers: JSON_RESPONSE,
		body: JSON.stringify(file),
	});
};

export const getDownloads = (statusOption?: StatusOption): Promise<DownloadingFile[]> => {
	const endpoint = statusOption ? `${ENDPOINT}?status=${statusOption}` : ENDPOINT;

	return fetch(endpoint, {
		method: "GET",
		headers: JSON_RESPONSE,
	}).then((res) => res.json());
};
