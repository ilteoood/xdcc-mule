import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import apiController from "../../src/routes/api.js";

vi.mock("../../src/utils/xdccDatabase.js", () => ({
	search: vi.fn().mockResolvedValue([]),
	refresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/utils/xdccDownload.js", () => ({
	download: vi.fn().mockResolvedValue(undefined),
	statuses: vi.fn().mockReturnValue([]),
	cancel: vi.fn(),
}));

describe("api route", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify();
		await app.register(apiController, { prefix: "/api" });
		await app.ready();
	});

	afterEach(() => app.close());

	describe("route registration", () => {
		it("should register files route under /api/files", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/files",
			});

			expect(response.statusCode).toBe(200);
		});

		it("should register downloads route under /api/downloads", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/downloads",
			});

			expect(response.statusCode).toBe(200);
		});
	});
});
