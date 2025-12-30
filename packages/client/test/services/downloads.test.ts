import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { downloadFile, cancelDownload, getDownloads, statusOptions, type DownloadableFile } from "../../src/services/downloads";

describe("downloads service", () => {
	const mockFetch = vi.fn();
	const originalFetch = global.fetch;

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	describe("statusOptions", () => {
		it("should export correct status options", () => {
			expect(statusOptions).toStrictEqual(["pending", "downloading", "downloaded", "error", "cancelled"]);
		});
	});

	describe("downloadFile", () => {
		it("should send POST request to /api/downloads with file data", async () => {
			const mockFile: DownloadableFile = {
				channelName: "test-channel",
				network: "test-network",
				fileNumber: "1",
				botName: "test-bot",
				fileSize: "100MB",
				fileName: "test-file.txt",
			};

			mockFetch.mockResolvedValueOnce({ ok: true });

			await downloadFile(mockFile);

			expect(mockFetch).toHaveBeenCalledWith("/api/downloads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(mockFile),
			});
		});
	});

	describe("cancelDownload", () => {
		it("should send DELETE request to /api/downloads with file data", async () => {
			const mockFile: DownloadableFile = {
				channelName: "test-channel",
				network: "test-network",
				fileNumber: "1",
				botName: "test-bot",
				fileSize: "100MB",
				fileName: "test-file.txt",
			};

			mockFetch.mockResolvedValueOnce({ ok: true });

			await cancelDownload(mockFile);

			expect(mockFetch).toHaveBeenCalledWith("/api/downloads", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(mockFile),
			});
		});
	});

	describe("getDownloads", () => {
		it("should send GET request to /api/downloads without status filter", async () => {
			const mockDownloads = [{ fileName: "file1.txt" }, { fileName: "file2.txt" }];
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(mockDownloads),
			});

			const result = await getDownloads();

			expect(mockFetch).toHaveBeenCalledWith("/api/downloads", {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			expect(result).toStrictEqual(mockDownloads);
		});

		it("should send GET request to /api/downloads with status filter", async () => {
			const mockDownloads = [{ fileName: "file1.txt", status: "pending" }];
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(mockDownloads),
			});

			const result = await getDownloads("pending");

			expect(mockFetch).toHaveBeenCalledWith("/api/downloads?status=pending", {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			expect(result).toStrictEqual(mockDownloads);
		});
	});
});
