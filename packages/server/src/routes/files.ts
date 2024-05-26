import type { FastifyInstance } from "fastify";
import { refresh, search } from "../utils/xdccDatabase.js";

export default async function (fastify: FastifyInstance) {
	fastify.get<{ Querystring: { name: string } }>(
		"/",
		{
			schema: {
				querystring: {
					type: "object",
					properties: {
						name: {
							type: "string",
						},
					},
				},
				response: {
					200: {
						type: "array",
						items: {
							type: "object",
							properties: {
								channelName: { type: "string" },
								network: { type: "string" },
								fileNumber: { type: "string" },
								botName: { type: "string" },
								fileSize: { type: "string" },
								fileName: { type: "string" },
							},
						},
					},
				},
			},
		},
		(request) => {
			const { name } = request.query;

			return search(name);
		},
	);

	fastify.delete("/", refresh);
}
