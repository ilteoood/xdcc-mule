import * as undici from "undici";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create, parse, refresh, search } from "../../src/utils/xdccDatabase.js";
import { config } from "../../src/utils/config.js";

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
		excludedChannels: new Set<string>(),
	},
}));

const mockRun = vi.fn();
// biome-ignore lint/suspicious/noExplicitAny: Mock type flexibility needed
const mockAll: ReturnType<typeof vi.fn<any>> = vi.fn(() => []);
const mockPrepare = vi.fn(() => ({
	run: mockRun,
	all: mockAll,
}));
const mockExec = vi.fn();
const mockClose = vi.fn();

vi.mock("node:sqlite", () => {
	return {
		DatabaseSync: class {
			exec = mockExec;
			prepare = mockPrepare;
			close = mockClose;
		},
	};
});

describe("xdccDatabase", () => {
	const mockFetch = vi.mocked(undici.fetch);

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
		afterEach(() => {
			config.excludedChannels = new Set();
		});

		it("should create database and populate with channel data", async () => {
			mockFetch.mockResolvedValue({
				text: () =>
					Promise.resolve(`#1   AeC|1P|01 1.9G Foo-Fuugther.part01.rar
#2   AeC|1P|01 1.9G Foo-Fuugther.part02.rar`),
			} as Response);

			await create(parsedXdccDatabase);

			expect(mockExec).toHaveBeenCalled();
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

		it("should filter out excluded channels", async () => {
			config.excludedChannels = new Set(["#a-b-c"]);

			mockFetch.mockResolvedValue({
				text: () => Promise.resolve(`#1   Bot1 100M TestFile.txt`),
			} as Response);

			await create(parsedXdccDatabase);

			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith("http://www.pierpaolo.org/scripts.php");
		});

		it("should filter out multiple excluded channels", async () => {
			config.excludedChannels = new Set(["#a-b-c", "#Pierpaolo"]);

			mockFetch.mockResolvedValue({
				text: () => Promise.resolve(`#1   Bot1 100M TestFile.txt`),
			} as Response);

			await create(parsedXdccDatabase);

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should not filter when excludedChannels is empty", async () => {
			config.excludedChannels = new Set();

			mockFetch.mockResolvedValue({
				text: () => Promise.resolve(`#1   Bot1 100M TestFile.txt`),
			} as Response);

			await create(parsedXdccDatabase);

			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("search", () => {
		it("should search by filename", async () => {
			const dbRow = {
				channelName: "#test-channel",
				network: "irc.test.net",
				fileNumber: "#1",
				botName: "TestBot",
				fileSize: "500M",
				fileName: "Some File Name.txt",
			};

			mockAll.mockReturnValue([dbRow]);

			const result = await search("some name");

			expect(result).toStrictEqual([
				{
					...dbRow,
					id: "irc.test.net-#test-channel-TestBot-#1-Some File Name.txt-500M",
				},
			]);
		});

		it("should handle empty search results", async () => {
			mockAll.mockReturnValue([]);

			const result = await search("nonexistent");

			expect(result).toStrictEqual([]);
		});

		it("should convert search terms to LIKE pattern", async () => {
			mockAll.mockImplementation(function (this: unknown, param: unknown) {
				expect(param).toBe("%test%file%");
				return [];
			});

			const result = await search("test file");

			expect(result).toStrictEqual([]);
		});

		it("should handle undefined rows gracefully", async () => {
			mockAll.mockReturnValue([]);

			const result = await search("test");

			expect(result).toStrictEqual([]);
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
			expect(mockFetch).toHaveBeenNthCalledWith(1, "http://example.com/database", expect.any(Object));
			expect(mockFetch).toHaveBeenNthCalledWith(2, "http://test.com/script.php");
		});
	});
});
