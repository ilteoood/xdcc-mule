import { DatabaseSync, type StatementSync } from "node:sqlite";
import { Agent, fetch } from "undici";
import { config } from "./config.js";
import { addJobKey, type DownloadableFile } from "./utils.js";

type DatabaseContent = {
	channelName: string;
	scriptUrl: string;
	network: string;
};

const COLUMNS_PER_FILE = 4;

const retrieveDatabaseContent = async () => {
	const databaseContent = await fetch(config.databaseUrl, {
		dispatcher: new Agent({ connect: { timeout: 300_000 } }),
	});
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
	const database = new DatabaseSync(":memory:");

	database.exec(
		"CREATE TABLE files (channelName TEXT, network TEXT, fileNumber TEXT, botName TEXT, fileSize TEXT, fileName TEXT)",
	);

	return database;
};

let sqliteDb: DatabaseSync;

const adaptScriptLine = (line: string) =>
	line
		.split(" ")
		.map((item) => item.trim())
		.filter(Boolean);

const filterValidEntries = (line: string[]) => line.length >= COLUMNS_PER_FILE;

export const create = async (database: DatabaseContent[]) => {
	sqliteDb?.close();

	sqliteDb = createDbInstance();

	const preparedStatement: StatementSync = sqliteDb.prepare("INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)");

	const promises = database.map(async (channel) => {
		const { channelName, network } = channel;
		const scriptContent = await retrieveScriptContent(channel.scriptUrl);

		const validLines = scriptContent.split("\n").map(adaptScriptLine).filter(filterValidEntries);

		for (const [fileNumber, botName, fileSize, ...fileName] of validLines) {
			preparedStatement.run(channelName, network, fileNumber, botName, fileSize, fileName.join(" "));
		}
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

	const likeableValue = value.split(" ").filter(Boolean).join("%");
	const preparedStatement = sqliteDb.prepare("SELECT * FROM files WHERE fileName LIKE ?");
	const rows = preparedStatement.all(`%${likeableValue}%`) as unknown as DownloadableFile[];

	return rows.map(addJobKey);
};
