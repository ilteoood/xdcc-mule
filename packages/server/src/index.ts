import fastifyStatic from "@fastify/static";
import { dirname } from "desm";
import fastify from "fastify";
import fastifyCron from "fastify-cron";
import { join } from "path";
import apiController from "./routes/api.js";
import { refresh } from "./utils/xdccDatabase.js";
import config from "./utils/config.js";

const app = fastify();

app.register(apiController, {
	prefix: "/api",
});

app.register(fastifyStatic, {
	root: join(dirname(import.meta.url), "public"),
});

app.register(fastifyCron.default, {
	jobs: [
		{
			cronTime: "0 * * * *",
			onTick: refresh,
		},
	],
});

await app.listen({ port: config.port, host: "::" });
