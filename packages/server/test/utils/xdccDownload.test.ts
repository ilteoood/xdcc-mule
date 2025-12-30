import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { DownloadableFile, DownloadingFile } from "../../src/utils/utils.js";
import { buildJobKey, addJobKey } from "../../src/utils/utils.js";
import { statuses, cancel } from "../../src/utils/xdccDownload.js";

vi.mock("../../src/utils/config.js", () => ({
	config: {
		databaseUrl: "http://example.com/database",
		nickname: "test-bot",
		downloadPath: "./downloads",
		port: 3000,
	},
}));

vi.mock("xdccjs", () => ({
	default: {
		default: vi.fn(),
	},
}));

describe("xdccDownload", () => {
	const sampleFile: DownloadableFile = {
		channelName: "#test-channel",
		network: "irc.test.net",
		fileNumber: "#123",
		botName: "TestBot",
		fileSize: "500M",
		fileName: "TestFile.rar",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("statuses", () => {
		it("should return an array", () => {
			const result = statuses();

			expect(Array.isArray(result)).toBe(true);
		});

		it("should return empty array when no downloads exist", () => {
			const result = statuses();

			expect(result).toEqual([]);
		});
	});

	describe("cancel", () => {
		it("should handle cancelling non-existent download gracefully", () => {
			expect(() => cancel(sampleFile)).not.toThrow();
		});
	});

	describe("utility functions used by xdccDownload", () => {
		it("should use buildJobKey correctly for identifying downloads", () => {
			const jobKey = buildJobKey(sampleFile);

			expect(jobKey).toBe("irc.test.net-#test-channel-TestBot-#123-TestFile.rar-500M");
		});

		it("should use addJobKey to add id to download status", () => {
			const downloadStatus: DownloadingFile = {
				...sampleFile,
				status: "downloading",
				percentage: 50,
			};

			const withId = addJobKey(downloadStatus);

			expect(withId.id).toBe(buildJobKey(sampleFile));
			expect(withId.status).toBe("downloading");
			expect(withId.percentage).toBe(50);
		});

		it("should create unique job keys for different files", () => {
			const file1: DownloadableFile = {
				...sampleFile,
				fileNumber: "#1",
			};

			const file2: DownloadableFile = {
				...sampleFile,
				fileNumber: "#2",
			};

			expect(buildJobKey(file1)).not.toBe(buildJobKey(file2));
		});

		it("should create same job key for identical files", () => {
			const key1 = buildJobKey(sampleFile);
			const key2 = buildJobKey({ ...sampleFile });

			expect(key1).toBe(key2);
		});
	});
});
