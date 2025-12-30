import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import App from "../src/App";
import { createWrapper } from "./utils/testWrapper";

vi.mock("../src/services/downloads", () => ({
	getDownloads: vi.fn().mockResolvedValue([]),
	downloadFile: vi.fn(),
	cancelDownload: vi.fn(),
	statusOptions: ["pending", "downloading", "downloaded", "error", "cancelled"],
}));

vi.mock("../src/services/files", () => ({
	searchFile: vi.fn().mockResolvedValue([]),
	refreshDatabase: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("react-error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getDownloads } from "../src/services/downloads";
import { refreshDatabase } from "../src/services/files";

describe("App", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render the app with status dropdown", async () => {
		render(<App />, { wrapper: createWrapper() });

		expect(screen.getByText("Status:")).toBeInTheDocument();
		expect(screen.getByRole("combobox")).toBeInTheDocument();
	});

	it("should render refresh database button", async () => {
		render(<App />, { wrapper: createWrapper() });

		const buttons = screen.getAllByRole("button");
		expect(buttons.length).toBeGreaterThan(0);
	});

	it("should render search file dialog button", async () => {
		render(<App />, { wrapper: createWrapper() });

		const buttons = screen.getAllByRole("button");
		expect(buttons.some((btn) => btn.querySelector(".pi-file"))).toBe(true);
	});

	it("should call refreshDatabase when refresh button is clicked", async () => {
		const user = userEvent.setup();
		render(<App />, { wrapper: createWrapper() });

		const refreshButton = screen.getAllByRole("button").find((btn) => btn.querySelector(".pi-database"));
		if (refreshButton) {
			await user.click(refreshButton);
		}

		await waitFor(() => {
			expect(refreshDatabase).toHaveBeenCalled();
		});
	});

	it("should render DownloadList component", async () => {
		render(<App />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(getDownloads).toHaveBeenCalled();
		});
	});

	it("should filter downloads when status is selected", async () => {
		render(<App />, { wrapper: createWrapper() });

		const dropdown = screen.getByRole("combobox");
		fireEvent.click(dropdown);

		await waitFor(() => {
			const pendingOption = screen.getByText("pending");
			fireEvent.click(pendingOption);
		});

		await waitFor(() => {
			expect(getDownloads).toHaveBeenCalledWith("pending");
		});
	});

	it("should have dropdown with status options", async () => {
		render(<App />, { wrapper: createWrapper() });

		const dropdown = screen.getByRole("combobox");
		fireEvent.click(dropdown);

		await waitFor(() => {
			expect(screen.getByText("pending")).toBeInTheDocument();
			expect(screen.getByText("downloading")).toBeInTheDocument();
			expect(screen.getByText("downloaded")).toBeInTheDocument();
			expect(screen.getByText("error")).toBeInTheDocument();
			expect(screen.getByText("cancelled")).toBeInTheDocument();
		});
	});
});
