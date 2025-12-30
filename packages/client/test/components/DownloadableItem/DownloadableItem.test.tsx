import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { downloadableItem } from "../../../src/components/DownloadableItem/DownloadableItem";
import type { DownloadableFile, DownloadingFile } from "../../../src/services/downloads";

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
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		expect(screen.getByText("Name: test-file.txt")).toBeInTheDocument();
		expect(screen.getByText(/Location:.*test-network.*test-channel.*test-bot/)).toBeInTheDocument();
		expect(screen.getByText("Package number: 42")).toBeInTheDocument();
		expect(screen.getByText("Size: 100MB")).toBeInTheDocument();
		expect(screen.getByText("Status: pending")).toBeInTheDocument();
	});

	it("should render download button when action is download", () => {
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		const button = screen.getByRole("button");
		expect(button.querySelector(".pi-download")).toBeInTheDocument();
	});

	it("should render delete button when action is delete", () => {
		const ItemComponent = downloadableItem({ action: "delete" });
		render(<ItemComponent {...mockFile} />);

		const button = screen.getByRole("button");
		expect(button.querySelector(".pi-trash")).toBeInTheDocument();
		expect(button).toHaveClass("p-button-danger");
	});

	it("should call downloadFile when download button is clicked", async () => {
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(downloadFile).toHaveBeenCalledWith(mockFile);
	});

	it("should call cancelDownload when delete button is clicked", async () => {
		const ItemComponent = downloadableItem({ action: "delete" });
		render(<ItemComponent {...mockFile} />);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(cancelDownload).toHaveBeenCalledWith(mockFile);
	});

	it("should disable button after click", async () => {
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		const button = screen.getByRole("button");
		expect(button).not.toBeDisabled();

		fireEvent.click(button);

		expect(button).toBeDisabled();
	});

	it("should render progress bar when percentage > 0", () => {
		const fileWithProgress = { ...mockFile, percentage: 50.5 };
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...fileWithProgress} />);

		expect(screen.getByRole("progressbar")).toBeInTheDocument();
		expect(screen.getByText("50.50%")).toBeInTheDocument();
	});

	it("should not render progress bar when percentage is 0", () => {
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
	});

	it("should render ETA when eta > 0", () => {
		const fileWithEta = { ...mockFile, eta: 60000 };
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...fileWithEta} />);

		expect(screen.getByText(/ETA:/)).toBeInTheDocument();
	});

	it("should not render ETA when eta is 0", () => {
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...mockFile} />);

		expect(screen.queryByText(/ETA:/)).not.toBeInTheDocument();
	});

	it("should not render status when it is not provided", () => {
		const fileWithoutStatus = { ...mockFile, status: undefined as unknown as "pending" };
		const ItemComponent = downloadableItem({ action: "download" });
		render(<ItemComponent {...fileWithoutStatus} />);

		expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
	});

	it("should not render button when action is not provided", () => {
		const ItemComponent = downloadableItem({ action: "" });
		render(<ItemComponent {...mockFile} />);

		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
