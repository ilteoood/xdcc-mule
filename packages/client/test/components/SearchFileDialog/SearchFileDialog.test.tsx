import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SearchFileDialog } from "../../../src/components/SearchFileDialog/SearchFileDialog";

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

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("SearchFileDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render search button initially", () => {
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("should open dialog when button is clicked", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		await user.click(button);

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("Search file")).toBeInTheDocument();
	});

	it("should have disabled search button when file name is empty", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));

		const searchButton = screen.getByRole("button", { name: /search/i });
		expect(searchButton).toBeDisabled();
	});

	it("should enable search button when file name is entered", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "test");

		const searchButton = screen.getByRole("button", { name: /search/i });
		expect(searchButton).not.toBeDisabled();
	});

	it("should call searchFile when search button is clicked", async () => {
		vi.mocked(searchFile).mockResolvedValue([]);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "test-file");

		const searchButton = screen.getByRole("button", { name: /search/i });
		await user.click(searchButton);

		await waitFor(() => {
			expect(searchFile).toHaveBeenCalledWith("test-file");
		});
	});

	it("should call searchFile when Enter key is pressed", async () => {
		vi.mocked(searchFile).mockResolvedValue([]);
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));

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

		await user.click(screen.getByRole("button"));

		const input = screen.getByPlaceholderText("File name");
		await user.type(input, "search");

		const searchButton = screen.getByRole("button", { name: /search/i });
		await user.click(searchButton);

		await waitFor(() => {
			expect(screen.getByText("Name: search-result.txt")).toBeInTheDocument();
		});
	});

	it("should not render data view when file name is empty", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));

		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("should close dialog when close button is clicked", async () => {
		const user = userEvent.setup();
		render(<SearchFileDialog />, { wrapper: createWrapper() });

		await user.click(screen.getByRole("button"));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		const closeButton = screen.getByRole("button", { name: /close/i });
		await user.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});
});
