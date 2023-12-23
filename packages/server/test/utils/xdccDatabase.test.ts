import { describe, expect, it, vi } from "vitest";
import { create, parse, search } from "../../src/utils/xdccDatabase.js";

describe("xdccDatabase", () => {
	const parsedXdccDatabase = [
		{
			serverName: "#a-b-c",
			network: "irc.foo.biz",
			scriptUrl: "http://www.a-b-c.it/scripts.php",
		},
		{
			serverName: "#Pierpaolo",
			network: "irc.foo.biz",
			scriptUrl: "http://www.pierpaolo.org/scripts.php",
		},
	];

	describe("parse", () => {
		it("should parse database", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				text: () => `[foo]
0=foo*irc.foo.biz*http://foo.org/
1=#a-b-c*http://www.a-b-c.it/scripts.php*1 Mix*public
2=#Pierpaolo*http://www.pierpaolo.org/scripts.php*1 Mix*public`,
			});

			const database = await parse();

			expect(database).toStrictEqual(parsedXdccDatabase);
		});
	});

	describe("create", () => {
		it("should create a searchable orama database", async () => {
			globalThis.fetch = vi.fn().mockResolvedValue({
				text: () => `#1   AeC|1P|01 1.9G Foo-Fuugther.part01.rar
#2   AeC|1P|01 1.9G Foo-Fuugther.part02.rar`,
			});

			await create(parsedXdccDatabase);
			const result = await search("foo");

			expect(result).toStrictEqual([
				{
					channelName: "AeC|1P|01",
					fileName: "Foo-Fuugther.part01.rar",
					fileNumber: "#1",
					fileSize: "1.9G",
					network: "irc.foo.biz",
					serverName: "#a-b-c",
				},
				{
					channelName: "AeC|1P|01",
					fileName: "Foo-Fuugther.part02.rar",
					fileNumber: "#2",
					fileSize: "1.9G",
					network: "irc.foo.biz",
					serverName: "#a-b-c",
				},
				{
					channelName: "AeC|1P|01",
					fileName: "Foo-Fuugther.part01.rar",
					fileNumber: "#1",
					fileSize: "1.9G",
					network: "irc.foo.biz",
					serverName: "#Pierpaolo",
				},
				{
					channelName: "AeC|1P|01",
					fileName: "Foo-Fuugther.part02.rar",
					fileNumber: "#2",
					fileSize: "1.9G",
					network: "irc.foo.biz",
					serverName: "#Pierpaolo",
				},
			]);
		});
	});
});
