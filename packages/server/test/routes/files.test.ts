import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { search, refresh } from "../../src/utils/xdccDatabase.js";
import filesController from "../../src/routes/files.js";

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
		await app.register(filesController);
		await app.ready();
	});

	afterEach(() => app.close());

	describe("GET /", () => {
		it("should search files by name", async () => {
			const mockFile = {
				id: "irc.test.net-#test-TestBot-#1-TestFile.rar-100M",
				channelName: "#test",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "TestBot",
				fileSize: "100M",
				fileName: "TestFile.rar",
			};
			mockSearch.mockResolvedValue([mockFile]);

			const response = await app.inject({
				method: "GET",
				url: "/?name=test",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([
				{
					channelName: "#test",
					network: "irc.test.net",
					fileNumber: "#1",
					botName: "TestBot",
					fileSize: "100M",
					fileName: "TestFile.rar",
				},
			]);
			expect(mockSearch).toHaveBeenCalledWith("test");
		});

		it("should handle empty search results", async () => {
			mockSearch.mockResolvedValue([]);

			const response = await app.inject({
				method: "GET",
				url: "/?name=nonexistent",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([]);
		});

		it("should reject request without name parameter", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/",
			});

			expect(response.statusCode).toBe(400);
			expect(mockSearch).not.toHaveBeenCalled();
		});

		it("should reject request with empty name parameter", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/?name=",
			});

			expect(response.statusCode).toBe(400);
			expect(mockSearch).not.toHaveBeenCalled();
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
