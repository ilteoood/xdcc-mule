import type { FastifyInstance } from "fastify";
import type { DownloadableFile } from "../utils/utils.js";
import { cancel, download, statuses } from "../utils/xdccDownload.js";

const downloadableFileSchema = {
	type: "object",
	properties: {
		id: { type: "string" },
		channelName: { type: "string" },
		network: { type: "string" },
		fileNumber: { type: "string" },
		botName: { type: "string" },
		fileSize: { type: "string" },
		fileName: { type: "string" },
	},
};

export default async function (fastify: FastifyInstance) {
	fastify.get<{ Querystring: { status: string } }>(
		"/",
		{
			schema: {
				querystring: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["pending", "downloading", "downloaded", "error", "cancelled"],
						},
					},
				},
				response: {
					200: {
						type: "array",
						items: {
							type: "object",
							properties: {
								...downloadableFileSchema.properties,
								status: { type: "string" },
								percentage: { type: "number" },
								eta: { type: "number" },
								errorMessage: { type: "string" },
							},
						},
					},
				},
			},
		},
		(request) => {
			const { status } = request.query;
			const downloads = statuses();

			return status ? downloads.filter((download) => download.status === status) : downloads;
		},
	);

	fastify.post<{ Body: DownloadableFile }>(
		"/",
		{
			schema: {
				body: downloadableFileSchema,
			},
		},
		async (request, response) => {
			const fileRequest = request.body;

			await download(fileRequest);

			response.status(201);
		},
	);

	fastify.delete<{ Body: DownloadableFile }>(
		"/",
		{
			schema: {
				body: downloadableFileSchema,
			},
		},
		async (request) => {
			const fileRequest = request.body;

			cancel(fileRequest);
		},
	);
}
