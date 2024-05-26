import type { FastifyInstance } from "fastify";
import downloadsController from "./downloads.js";
import filesController from "./files.js";

export default async function (fastify: FastifyInstance) {
	fastify.register(filesController, {
		prefix: "/files",
	});

	fastify.register(downloadsController, {
		prefix: "/downloads",
	});
}
