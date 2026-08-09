import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SearchFileDialog } from "../../../src/components/SearchFileDialog/SearchFileDialog";
import { createWrapper } from "../../utils/testWrapper";

vi.mock("../../../src/services/files", () => ({
	searchFile: vi.fn(),
}));

vi.mock("../../../src/services/downloads", () => ({
	downloadFile: vi.fn(),
	cancelDownload: vi.fn(),
}));

vi.mock("react-error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { searchFile } from "../../../src/services/files";

describe("SearchFileDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render search button initially", () => {
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /search files/i });
		expect(button).toBeInTheDocument();
	});

	it("should open dialog when button is clicked", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Search file")).toBeInTheDocument();
	});

	it("should have disabled search button when file name is empty", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		const searchButton = screen.getByRole("button", { name: /^search$/i });
		expect(searchButton).toBeDisabled();
	});

	it("should enable search button when file name is entered", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "test");

		const searchButton = screen.getByRole("button", { name: /^search$/i });
		expect(searchButton).not.toBeDisabled();
	});

	it("should call searchFile when search button is clicked", async () => {
		vi.mocked(searchFile).mockResolvedValue([]);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "test-file");

		const searchButton = screen.getByRole("button", { name: /^search$/i });
		await user.click(searchButton);

		await waitFor(() => {
			expect(searchFile).toHaveBeenCalledWith("test-file");
		});
	});

	it("should call searchFile when Enter key is pressed", async () => {
		vi.mocked(searchFile).mockResolvedValue([]);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "test-file");
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(searchFile).toHaveBeenCalledWith("test-file");
		});
	});

	it("should render search results", async () => {
		const mockFiles = [
			{
				channelName: "test-channel",
				network: "test-network",
				fileNumber: "1",
				botName: "test-bot",
				fileSize: "100MB",
				fileName: "search-result.txt",
			},
		];
		vi.mocked(searchFile).mockResolvedValue(mockFiles);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "search");

		const searchButton = screen.getByRole("button", { name: /^search$/i });
		await user.click(searchButton);

		await waitFor(() => {
			expect(screen.getByText("search-result.txt")).toBeInTheDocument();
		});
	});

	it("should close dialog when close button is clicked", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		const closeButton = screen.getByRole("button", { name: /close/i });
		await user.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("should re-run the search when the file name changes", async () => {
		vi.mocked(searchFile).mockResolvedValue([]);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button", { name: /search files/i }));
		const input = screen.getByPlaceholderText("File name");
		const searchButton = screen.getByRole("button", { name: /^search$/i });

		await user.type(input, "first");
		await user.click(searchButton);
		await waitFor(() => {
			expect(searchFile).toHaveBeenLastCalledWith("first");
		});

		await user.clear(input);
		await user.type(input, "second");
		await user.click(searchButton);
		await waitFor(() => {
			expect(searchFile).toHaveBeenLastCalledWith("second");
		});

		expect(searchFile).toHaveBeenCalledTimes(2);
	});
});