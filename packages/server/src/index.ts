import fastifyStatic from "@fastify/static";
import { fastifyCronJob } from '@kakang/fastify-cronjob';
import { dirname } from "desm";
import fastify from "fastify";
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

app.register(fastifyCronJob);

app.cronjob.setCronJob(refresh, "0 * * * *", 'async')

app.listen({ port: config.port, host: "::" });
