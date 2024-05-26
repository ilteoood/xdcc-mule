export const config = {
	databaseUrl: process.env.DATABASE_URL as string,
	nickname: process.env.NICKNAME || "xdcc-mule",
	downloadPath: process.env.DOWNLOAD_PATH || "./",
	port: Number.parseInt(process.env.PORT as string) || 3000,
};
