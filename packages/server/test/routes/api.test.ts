import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fastify from "fastify";
import type { FastifyInstance } from "fastify";

// Mock child routes
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
		const apiController = (await import("../../src/routes/api.js")).default;
		await app.register(apiController, { prefix: "/api" });
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("route registration", () => {
		it("should register files route under /api/files", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/files",
			});

			// Route exists (not 404)
			expect(response.statusCode).toBe(200);
		});

		it("should register downloads route under /api/downloads", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/downloads",
			});

			// Route exists (not 404)
			expect(response.statusCode).toBe(200);
		});
	});
});
