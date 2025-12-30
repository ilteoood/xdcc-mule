import { describe, expect, it } from "vitest";
import { addJobKey, buildJobKey, type DownloadableFile } from "../../src/utils/utils.js";

describe("utils", () => {
	const sampleFile: DownloadableFile = {
		channelName: "#test-channel",
		network: "irc.test.net",
		fileNumber: "#123",
		botName: "TestBot",
		fileSize: "500M",
		fileName: "TestFile.rar",
	};

	describe("buildJobKey", () => {
		it("should build a unique job key from file properties", () => {
			const key = buildJobKey(sampleFile);

			expect(key).toBe("irc.test.net-#test-channel-TestBot-#123-TestFile.rar-500M");
		});

		it("should handle special characters in file properties", () => {
			const fileWithSpecialChars: DownloadableFile = {
				channelName: "#channel-with-dash",
				network: "irc.server.net",
				fileNumber: "#1",
				botName: "Bot|Special|Name",
				fileSize: "1.5G",
				fileName: "File With Spaces (2024).mkv",
			};

			const key = buildJobKey(fileWithSpecialChars);

			expect(key).toBe("irc.server.net-#channel-with-dash-Bot|Special|Name-#1-File With Spaces (2024).mkv-1.5G");
		});

		it("should generate different keys for different files", () => {
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
	});

	describe("addJobKey", () => {
		it("should add id property to file object", () => {
			const result = addJobKey(sampleFile);

			expect(result).toHaveProperty("id");
			expect(result.id).toBe(buildJobKey(sampleFile));
		});

		it("should preserve all original properties", () => {
			const result = addJobKey(sampleFile);

			expect(result.channelName).toBe(sampleFile.channelName);
			expect(result.network).toBe(sampleFile.network);
			expect(result.fileNumber).toBe(sampleFile.fileNumber);
			expect(result.botName).toBe(sampleFile.botName);
			expect(result.fileSize).toBe(sampleFile.fileSize);
			expect(result.fileName).toBe(sampleFile.fileName);
		});

		it("should work with extended file types", () => {
			interface ExtendedFile extends DownloadableFile {
				extraProp: string;
			}

			const extendedFile: ExtendedFile = {
				...sampleFile,
				extraProp: "extra value",
			};

			const result = addJobKey(extendedFile);

			expect(result.extraProp).toBe("extra value");
			expect(result.id).toBe(buildJobKey(extendedFile));
		});
	});
});
