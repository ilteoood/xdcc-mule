import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";

// Mock xdccDownload module
vi.mock("../../src/utils/xdccDownload.js", () => ({
	download: vi.fn(),
	statuses: vi.fn(),
	cancel: vi.fn(),
}));

describe("downloads route", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify();
		const downloadsController = (await import("../../src/routes/downloads.js")).default;
		await app.register(downloadsController);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("GET /", () => {
		it("should return all downloads statuses", async () => {
			const { statuses } = await import("../../src/utils/xdccDownload.js");
			const mockStatuses = vi.mocked(statuses);
			mockStatuses.mockReturnValue([
				{
					id: "test-id",
					channelName: "#test",
					network: "irc.test.net",
					fileNumber: "#1",
					botName: "Bot1",
					fileSize: "100M",
					fileName: "TestFile.rar",
					status: "downloading",
					percentage: 50,
				},
			]);

			const response = await app.inject({
				method: "GET",
				url: "/",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body).toHaveLength(1);
			expect(body[0].status).toBe("downloading");
			expect(body[0].percentage).toBe(50);
		});

		it("should filter downloads by status", async () => {
			const { statuses } = await import("../../src/utils/xdccDownload.js");
			const mockStatuses = vi.mocked(statuses);
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
				{
					id: "id-2",
					channelName: "#test",
					network: "irc.test.net",
					fileNumber: "#2",
					botName: "Bot1",
					fileSize: "200M",
					fileName: "File2.rar",
					status: "downloaded",
					percentage: 100,
				},
			]);

			const response = await app.inject({
				method: "GET",
				url: "/?status=downloading",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body).toHaveLength(1);
			expect(body[0].status).toBe("downloading");
		});

		it("should return empty array when no downloads match status", async () => {
			const { statuses } = await import("../../src/utils/xdccDownload.js");
			const mockStatuses = vi.mocked(statuses);
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
			const body = JSON.parse(response.body);
			expect(body).toEqual([]);
		});
	});

	describe("POST /", () => {
		it("should start a download and return 201", async () => {
			const { download } = await import("../../src/utils/xdccDownload.js");
			const mockDownload = vi.mocked(download);
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
			const { cancel } = await import("../../src/utils/xdccDownload.js");
			const mockCancel = vi.mocked(cancel);

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
