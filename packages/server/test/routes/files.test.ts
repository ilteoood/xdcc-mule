import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { search, refresh } from "../../src/utils/xdccDatabase.js";

vi.mock("../../src/utils/xdccDatabase.js", () => ({
	search: vi.fn(),
	refresh: vi.fn(),
}));

describe("files route", () => {
	let app: FastifyInstance;
	const mockSearch = vi.mocked(search);
	const mockRefresh = vi.mocked(refresh);

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify();
		const filesController = (await import("../../src/routes/files.js")).default;
		await app.register(filesController);
		await app.ready();
	});

	afterEach(() => app.close());

	describe("GET /", () => {
		it("should search files by name", async () => {
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
