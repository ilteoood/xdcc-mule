import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { searchFile, refreshDatabase } from "../../src/services/files";

describe("files service", () => {
	const mockFetch = vi.fn();
	const originalFetch = global.fetch;

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	describe("searchFile", () => {
		it("should send GET request to /api/files with name parameter", async () => {
			const mockFiles = [{ fileName: "test.txt" }];
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(mockFiles),
			});

			const result = await searchFile("test");

			expect(mockFetch).toHaveBeenCalledWith("/api/files?name=test", {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			expect(result).toStrictEqual(mockFiles);
		});

		it("should handle special characters in file name", async () => {
			const mockFiles: unknown[] = [];
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(mockFiles),
			});

			const result = await searchFile("my file");

			expect(mockFetch).toHaveBeenCalledWith("/api/files?name=my file", {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			expect(result).toStrictEqual(mockFiles);
		});
	});

	describe("refreshDatabase", () => {
		it("should send DELETE request to /api/files", async () => {
			mockFetch.mockResolvedValueOnce({ ok: true });

			await refreshDatabase();

			expect(mockFetch).toHaveBeenCalledWith("/api/files", { method: "DELETE" });
		});
	});
});
