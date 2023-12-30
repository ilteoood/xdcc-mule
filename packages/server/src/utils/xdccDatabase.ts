import sqlite3 from "sqlite3";
import { Agent, fetch, setGlobalDispatcher } from "undici";
import { config } from "./config.js";

setGlobalDispatcher(new Agent({ connect: { timeout: 300_000 } }));

type DatabaseContent = {
	channelName: string;
	scriptUrl: string;
	network: string;
};

const COLUMNS_PER_FILE = 4;

const retrieveDatabaseContent = async () => {
	const databaseContent = await fetch(config.databaseUrl);
	return databaseContent.text();
};

const extractDatabaseInfo = (databaseContent: string): DatabaseContent[] => {
	const extractedChannels: DatabaseContent[] = [];

	let parsedNetwrok = "";

	for (let line of databaseContent.split("\n")) {
		if (line.startsWith("0=")) {
			parsedNetwrok = line.split("*")[1];
		} else if (line && !line.startsWith("[")) {
			line = line.split("=")[1];
			const [channelName, scriptUrl] = line.split("*");

			extractedChannels.push({
				channelName,
				scriptUrl,
				network: parsedNetwrok,
			});
		}
	}

	return extractedChannels;
};

export const parse = async () => {
	const databaseContent = await retrieveDatabaseContent();

	return extractDatabaseInfo(databaseContent);
};

const retrieveScriptContent = async (scriptUrl: string) => {
	const scriptContent = await fetch(scriptUrl);
	return scriptContent.text();
};

const createDbInstance = () => {
	const database = new sqlite3.Database(":memory:");

	return database.run(
		"CREATE TABLE files (channelName TEXT, network TEXT, fileNumber TEXT, botName TEXT, fileSize TEXT, fileName TEXT)",
	);
};

let sqliteDb: sqlite3.Database;

const adaptScriptLine = (line: string) =>
	line
		.split(" ")
		.map((item) => item.trim())
		.filter(Boolean);

const filterValidEntries = (line: string[]) => line.length >= COLUMNS_PER_FILE;

export const create = async (database: DatabaseContent[]) => {
	sqliteDb?.close();

	sqliteDb = createDbInstance();

	const promises = database.map(async (channel) => {
		const { channelName, network } = channel;
		const scriptContent = await retrieveScriptContent(channel.scriptUrl);

		const preparedStatement = sqliteDb.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)");

		const validLines = scriptContent.split("\n").map(adaptScriptLine).filter(filterValidEntries);

		for (const [fileNumber, botName, fileSize, ...fileName] of validLines) {
			preparedStatement.run(channelName, network, fileNumber, botName, fileSize, fileName.join(" "));
		}

		preparedStatement.finalize();
	});

	await Promise.allSettled(promises);
};

export const refresh = async () => {
	const xdccDatabase = await parse();
	await create(xdccDatabase);
};

export const search = async (value: string) => {
	if (!sqliteDb) {
		await refresh();
	}

	return new Promise((resolve) => {
		const likeableValue = value.split(" ").filter(Boolean).join("%");
		sqliteDb.all("SELECT * FROM files WHERE fileName LIKE ?", [`%${likeableValue}%`], (_err, rows = []) =>
			resolve(rows),
		);
	});
};
