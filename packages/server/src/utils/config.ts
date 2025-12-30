const parseExcludedChannels = (excludedChannels = ""): Set<string> =>
	new Set(
		excludedChannels
			.split(",")
			.map((channel) => channel.trim())
			.filter(Boolean),
	);

export const config = {
	databaseUrl: process.env.DATABASE_URL as string,
	nickname: process.env.NICKNAME || "xdcc-mule",
	downloadPath: process.env.DOWNLOAD_PATH || "./",
	port: Number.parseInt(process.env.PORT as string) || 3000,
	excludedChannels: parseExcludedChannels(process.env.EXCLUDED_CHANNELS),
};
