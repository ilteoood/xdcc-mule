import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DownloadList } from "../../src/components/DownloadList";
import { createWrapper } from "../utils/testWrapper";

vi.mock("../../src/services/downloads", () => ({
	getDownloads: vi.fn(),
	downloadFile: vi.fn(),
	cancelDownload: vi.fn(),
	statusOptions: ["pending", "downloading", "downloaded", "error", "cancelled"],
}));

vi.mock("react-error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getDownloads } from "../../src/services/downloads";

describe("DownloadList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render loading state initially", async () => {
		vi.mocked(getDownloads).mockImplementation(() => new Promise(() => {}));

		render(<DownloadList />, { wrapper: createWrapper() });

		screen.getByRole("progressbar");
	});

	it("should render downloads when data is available", async () => {
		const mockDownloads = [
			{
				channelName: "test-channel",
				network: "test-network",
				fileNumber: "1",
				botName: "test-bot",
				fileSize: "100MB",
				fileName: "test-file.txt",
				status: "pending",
				percentage: 0,
				eta: 0,
			},
		];

		vi.mocked(getDownloads).mockResolvedValue(mockDownloads);

		render(<DownloadList />, { wrapper: createWrapper() });

		await screen.findByText("Name: test-file.txt");
	});

	it("should call getDownloads with status filter when provided", async () => {
		vi.mocked(getDownloads).mockResolvedValue([]);

		render(<DownloadList statusOption="pending" />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(getDownloads).toHaveBeenCalledWith("pending");
		});
	});

	it("should call getDownloads without status filter when not provided", async () => {
		vi.mocked(getDownloads).mockResolvedValue([]);

		render(<DownloadList />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(getDownloads).toHaveBeenCalledWith(undefined);
		});
	});

	it("should render error state when query fails", async () => {
		vi.mocked(getDownloads).mockRejectedValue(new Error("Network error"));

		render(<DownloadList />, { wrapper: createWrapper() });

		await screen.findByText("Something went wrong");
	});

	it("should render empty list when no downloads", async () => {
		vi.mocked(getDownloads).mockResolvedValue([]);

		render(<DownloadList />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(getDownloads).toHaveBeenCalled();
		});

		expect(screen.queryByText(/Name:/)).not.toBeInTheDocument();
	});
});
