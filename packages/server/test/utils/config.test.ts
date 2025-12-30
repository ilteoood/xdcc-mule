import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("config", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should use environment variables when set", async () => {
		process.env.DATABASE_URL = "http://custom-database.com";
		process.env.NICKNAME = "custom-bot";
		process.env.DOWNLOAD_PATH = "/custom/path";
		process.env.PORT = "8080";

		const { config } = await import("../../src/utils/config.js");

		expect(config.databaseUrl).toBe("http://custom-database.com");
		expect(config.nickname).toBe("custom-bot");
		expect(config.downloadPath).toBe("/custom/path");
		expect(config.port).toBe(8080);
	});

	it("should use default values when environment variables are not set", async () => {
		delete process.env.DATABASE_URL;
		delete process.env.NICKNAME;
		delete process.env.DOWNLOAD_PATH;
		delete process.env.PORT;

		const { config } = await import("../../src/utils/config.js");

		expect(config.nickname).toBe("xdcc-mule");
		expect(config.downloadPath).toBe("./");
		expect(config.port).toBe(3000);
	});

	it("should handle invalid port number", async () => {
		process.env.PORT = "invalid";

		const { config } = await import("../../src/utils/config.js");

		expect(config.port).toBe(3000);
	});
});
