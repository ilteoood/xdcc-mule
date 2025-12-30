import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as undici from "undici";
import { parse, create, search, refresh } from "../../src/utils/xdccDatabase.js";
import sqlite3 from "sqlite3";

vi.mock("undici", () => ({
	Agent: vi.fn(),
	fetch: vi.fn(),
}));

vi.mock("../../src/utils/config.js", () => ({
	config: {
		databaseUrl: "http://example.com/database",
		nickname: "test-bot",
		downloadPath: "./downloads",
		port: 3000,
	},
}));

const mockRun = vi.fn((_query: string, _params?: unknown[], callback?: (err: Error | null) => void) => {
	if (callback) callback(null);
	return mockDb;
});
const mockAll = vi.fn(
	(_query: string, _params: unknown[], callback: (err: Error | null, rows: unknown[]) => void) => {
		callback(null, []);
	},
);
const mockPrepare = vi.fn(() => ({
	run: vi.fn(),
	finalize: vi.fn((callback: () => void) => callback()),
}));
const mockClose = vi.fn();
const mockDb = {
	run: mockRun,
	all: mockAll,
	prepare: mockPrepare,
	close: mockClose,
};

vi.mock("sqlite3", () => ({
	default: {
		Database: vi.fn(() => mockDb),
	},
}));

describe("xdccDatabase", () => {
	const mockFetch = vi.mocked(undici.fetch);
	const mockSqlite3 = vi.mocked(sqlite3);

	const parsedXdccDatabase = [
		{
			channelName: "#a-b-c",
			network: "irc.foo.biz",
			scriptUrl: "http://www.a-b-c.it/scripts.php",
		},
		{
			channelName: "#Pierpaolo",
			network: "irc.foo.biz",
			scriptUrl: "http://www.pierpaolo.org/scripts.php",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("parse", () => {
		it("should parse database", async () => {
			mockFetch.mockResolvedValue({
				text: () =>
					Promise.resolve(`[foo]
0=foo*irc.foo.biz*http://foo.org/
1=#a-b-c*http://www.a-b-c.it/scripts.php*1 Mix*public
2=#Pierpaolo*http://www.pierpaolo.org/scripts.php*1 Mix*public`),
			} as Response);

			const database = await parse();

			expect(database).toStrictEqual(parsedXdccDatabase);
		});

		it("should handle empty database content", async () => {
			mockFetch.mockResolvedValue({
				text: () => Promise.resolve(""),
			} as Response);

			const database = await parse();

			expect(database).toStrictEqual([]);
		});

		it("should handle only header lines", async () => {
			mockFetch.mockResolvedValue({
				text: () => Promise.resolve("[section1]\n[section2]"),
			} as Response);

			const database = await parse();

			expect(database).toStrictEqual([]);
		});
	});

	describe("create", () => {
		it("should create database and populate with channel data", async () => {
			mockFetch.mockResolvedValue({
				text: () =>
					Promise.resolve(`#1   AeC|1P|01 1.9G Foo-Fuugther.part01.rar
#2   AeC|1P|01 1.9G Foo-Fuugther.part02.rar`),
			} as Response);

			await create(parsedXdccDatabase);

			expect(mockSqlite3.Database).toHaveBeenCalledWith(":memory:");
			expect(mockPrepare).toHaveBeenCalledWith("INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)");
		});

		it("should filter out invalid script lines", async () => {
			mockFetch.mockResolvedValue({
				text: () =>
					Promise.resolve(`#1   Bot1 100M Valid File.txt
invalid line
#2
   
#3   Bot2 200M Another Valid.txt`),
			} as Response);

			await create([
				{
					channelName: "#test",
					network: "irc.test.net",
					scriptUrl: "http://test.com/script.php",
				},
			]);

			expect(mockPrepare).toHaveBeenCalled();
		});
	});

	describe("search", () => {
		it("should search by filename", async () => {
			const testResults = [
				{
					channelName: "#test-channel",
					network: "irc.test.net",
					fileNumber: "#1",
					botName: "TestBot",
					fileSize: "500M",
					fileName: "Some File Name.txt",
				},
			];

			mockAll.mockImplementation((_query, _params, callback) => {
				callback(null, testResults);
			});

			const result = await search("some name");

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				fileName: "Some File Name.txt",
				id: "irc.test.net-#test-channel-TestBot-#1-Some File Name.txt-500M",
			});
		});

		it("should handle empty search results", async () => {
			mockAll.mockImplementation((_query, _params, callback) => {
				callback(null, []);
			});

			const result = await search("nonexistent");

			expect(Array.isArray(result)).toBe(true);
			expect(result).toHaveLength(0);
		});

		it("should convert search terms to LIKE pattern", async () => {
			mockAll.mockImplementation((_query, params, callback) => {
				expect(params[0]).toBe("%test%file%");
				callback(null, []);
			});

			await search("test file");
		});

		it("should handle undefined rows gracefully", async () => {
			mockAll.mockImplementation((_query, _params, callback) => {
				callback(null, undefined as unknown as unknown[]);
			});

			const result = await search("test");

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("refresh", () => {
		it("should parse and create database", async () => {
			mockFetch
				.mockResolvedValueOnce({
					text: () =>
						Promise.resolve(`[foo]
0=foo*irc.foo.biz*http://foo.org/
1=#test*http://test.com/script.php*1 Mix*public`),
				} as Response)
				.mockResolvedValueOnce({
					text: () => Promise.resolve(`#1   Bot1 100M TestFile.txt`),
				} as Response);

			await refresh();

			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});
});
