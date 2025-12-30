import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { download, statuses, cancel } from "../../src/utils/xdccDownload.js";
import downloadsController from "../../src/routes/downloads.js";

vi.mock("../../src/utils/xdccDownload.js", () => ({
	download: vi.fn(),
	statuses: vi.fn(),
	cancel: vi.fn(),
}));

describe("downloads route", () => {
	let app: FastifyInstance;
	const mockDownload = vi.mocked(download);
	const mockStatuses = vi.mocked(statuses);
	const mockCancel = vi.mocked(cancel);

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify();
		await app.register(downloadsController);
		await app.ready();
	});

	afterEach(() => app.close());

	describe("GET /", () => {
		it("should return all downloads statuses", async () => {
			const expectedDownload = {
				id: "test-id",
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "Bot1",
				fileSize: "100M",
				fileName: "TestFile.rar",
				status: "downloading",
				percentage: 50,
			};
			mockStatuses.mockReturnValue([expectedDownload]);

			const response = await app.inject({
				method: "GET",
				url: "/",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([expectedDownload]);
		});

		it("should filter downloads by status", async () => {
			const downloadingFile = {
				id: "id-1",
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "Bot1",
				fileSize: "100M",
				fileName: "File1.rar",
				status: "downloading",
				percentage: 50,
			};
			const downloadedFile = {
				id: "id-2",
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#2",
				botName: "Bot1",
				fileSize: "200M",
				fileName: "File2.rar",
				status: "downloaded",
				percentage: 100,
			};
			mockStatuses.mockReturnValue([downloadingFile, downloadedFile]);

			const response = await app.inject({
				method: "GET",
				url: "/?status=downloading",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([downloadingFile]);
		});

		it("should return empty array when no downloads match status", async () => {
			mockStatuses.mockReturnValue([
				{
					id: "id-1",
					channelName: "#test",
					network: "irc.test.net",
					fileNumber: "#1",
					botName: "Bot1",
					fileSize: "100M",
					fileName: "File1.rar",
					status: "downloading",
					percentage: 50,
				},
			]);

			const response = await app.inject({
				method: "GET",
				url: "/?status=error",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([]);
		});
	});

	describe("POST /", () => {
		it("should start a download and return 201", async () => {
			mockDownload.mockResolvedValue();

			const fileRequest = {
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "Bot1",
				fileSize: "100M",
				fileName: "TestFile.rar",
			};

			const response = await app.inject({
				method: "POST",
				url: "/",
				payload: fileRequest,
			});

			expect(response.statusCode).toBe(201);
			expect(mockDownload).toHaveBeenCalledWith(fileRequest);
		});
	});

	describe("DELETE /", () => {
		it("should cancel a download", async () => {
			const fileRequest = {
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "Bot1",
				fileSize: "100M",
				fileName: "TestFile.rar",
			};

			const response = await app.inject({
				method: "DELETE",
				url: "/",
				payload: fileRequest,
			});

			expect(response.statusCode).toBe(200);
			expect(mockCancel).toHaveBeenCalledWith(fileRequest);
		});
	});
});
