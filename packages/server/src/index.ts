import fastifyStatic from "@fastify/static";
import { dirname } from "desm";
import fastify from "fastify";
import { join } from "path";
import apiController from "./routes/api.js";

const app = fastify();

app.register(apiController, {
	prefix: "/api",
});

app.register(fastifyStatic, {
	root: join(dirname(import.meta.url), "public"),
});

await app.listen({ port: 3000, host: "::" });
