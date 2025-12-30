import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";

// Mock xdccDatabase module
vi.mock("../../src/utils/xdccDatabase.js", () => ({
	search: vi.fn(),
	refresh: vi.fn(),
}));

describe("files route", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify();
		const filesController = (await import("../../src/routes/files.js")).default;
		await app.register(filesController);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("GET /", () => {
		it("should search files by name", async () => {
			const { search } = await import("../../src/utils/xdccDatabase.js");
			const mockSearch = vi.mocked(search);
			mockSearch.mockResolvedValue([
				{
					id: "test-id",
					channelName: "#test",
					network: "irc.test.net",
					fileNumber: "#1",
					botName: "Bot1",
					fileSize: "100M",
					fileName: "TestFile.rar",
				},
			]);

			const response = await app.inject({
				method: "GET",
				url: "/?name=test",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body).toHaveLength(1);
			expect(body[0].fileName).toBe("TestFile.rar");
			expect(mockSearch).toHaveBeenCalledWith("test");
		});

		it("should handle empty search results", async () => {
			const { search } = await import("../../src/utils/xdccDatabase.js");
			const mockSearch = vi.mocked(search);
			mockSearch.mockResolvedValue([]);

			const response = await app.inject({
				method: "GET",
				url: "/?name=nonexistent",
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body).toEqual([]);
		});

		it("should search with undefined name parameter", async () => {
			const { search } = await import("../../src/utils/xdccDatabase.js");
			const mockSearch = vi.mocked(search);
			mockSearch.mockResolvedValue([]);

			const response = await app.inject({
				method: "GET",
				url: "/",
			});

			expect(response.statusCode).toBe(200);
			expect(mockSearch).toHaveBeenCalledWith(undefined);
		});
	});

	describe("DELETE /", () => {
		it("should call refresh to rebuild database", async () => {
			const { refresh } = await import("../../src/utils/xdccDatabase.js");
			const mockRefresh = vi.mocked(refresh);
			mockRefresh.mockResolvedValue();

			const response = await app.inject({
				method: "DELETE",
				url: "/",
			});

			expect(response.statusCode).toBe(200);
			expect(mockRefresh).toHaveBeenCalled();
		});
	});
});
