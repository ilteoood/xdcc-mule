import fastifyStatic from "@fastify/static";
import { dirname } from "desm";
import fastify from "fastify";
import cron from 'node-cron';
import { join } from "node:path";
import apiController from "./routes/api.js";
import { config } from "./utils/config.js";
import { refresh } from "./utils/xdccDatabase.js";

const app = fastify();

app.register(apiController, {
	prefix: "/api",
});

app.register(fastifyStatic, {
	root: join(dirname(import.meta.url), "public"),
});

app.listen({ port: config.port, host: "::" }, () => {
	cron.schedule('0 * * * *', refresh);
});
