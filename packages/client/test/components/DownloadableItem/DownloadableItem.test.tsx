import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DownloadableItem } from "../../../src/components/DownloadableItem/DownloadableItem";
import type { DownloadableFile, DownloadingFile } from "../../../src/services/downloads";
import { createWrapper } from "../../utils/testWrapper";

vi.mock("../../../src/services/downloads", async (importOriginal) => {
	const original = await importOriginal<typeof import("../../../src/services/downloads")>();
	return {
		...original,
		downloadFile: vi.fn().mockResolvedValue({ ok: true }),
		cancelDownload: vi.fn().mockResolvedValue({ ok: true }),
	};
});

import { downloadFile, cancelDownload } from "../../../src/services/downloads";

describe("downloadableItem", () => {
	const mockFile: DownloadableFile & DownloadingFile = {
		channelName: "test-channel",
		network: "test-network",
		fileNumber: "42",
		botName: "test-bot",
		fileSize: "100MB",
		fileName: "test-file.txt",
		status: "pending",
		percentage: 0,
		eta: 0,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render file information correctly", () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.getByText("Name: test-file.txt")).toBeInTheDocument();
		expect(screen.getByText(/Location:.*test-network.*test-channel.*test-bot/)).toBeInTheDocument();
		expect(screen.getByText("Package number: 42")).toBeInTheDocument();
		expect(screen.getByText("Size: 100MB")).toBeInTheDocument();
		expect(screen.getByText("Status: pending")).toBeInTheDocument();
	});

	it("should render download button when action is download", () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
	});

	it("should render delete button when action is delete", () => {
		render(<DownloadableItem action={"delete"} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
	});

	it("should call downloadFile when download button is clicked", async () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /download/i });
		fireEvent.click(button);

		expect(downloadFile).toHaveBeenCalledWith(mockFile);
	});

	it("should call cancelDownload when delete button is clicked", async () => {
		render(<DownloadableItem action={"delete"} {...mockFile} />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /delete/i });
		fireEvent.click(button);

		expect(cancelDownload).toHaveBeenCalledWith(mockFile);
	});

	it("should disable button after click", async () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /download/i });
		expect(button).not.toBeDisabled();

		fireEvent.click(button);

		expect(button).toBeDisabled();
	});

	it("should render progress bar when percentage > 0", () => {
		const fileWithProgress = { ...mockFile, percentage: 50.5 };
		render(<DownloadableItem action={"download"} {...fileWithProgress} />, { wrapper: createWrapper() });

		expect(screen.getByRole("progressbar")).toBeInTheDocument();
		expect(screen.getByText("50.5%")).toBeInTheDocument();
	});

	it("should not render progress bar when percentage is 0", () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
	});

	it("should render ETA when eta > 0", () => {
		const fileWithEta = { ...mockFile, eta: 60000 };
		render(<DownloadableItem action={"download"} {...fileWithEta} />, { wrapper: createWrapper() });

		expect(screen.getByText(/ETA:/)).toBeInTheDocument();
	});

	it("should not render ETA when eta is 0", () => {
		render(<DownloadableItem action={"download"} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.queryByText(/ETA:/)).not.toBeInTheDocument();
	});

	it("should not render status when it is not provided", () => {
		const fileWithoutStatus = { ...mockFile, status: undefined as unknown as "pending" };
		render(<DownloadableItem action={"download"} {...fileWithoutStatus} />, { wrapper: createWrapper() });

		expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
	});

	it("should not render button when action is not provided", () => {
		render(<DownloadableItem action={""} {...mockFile} />, { wrapper: createWrapper() });

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});