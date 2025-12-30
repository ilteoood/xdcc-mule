import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

vi.mock("react-error-boundary", () => ({
	ErrorBoundary: ({ children }: { children: React.ReactNode; fallback: React.ReactNode }) => (
		<div data-testid="react-error-boundary">{children}</div>
	),
}));

describe("ErrorBoundary", () => {
	it("should render loading spinner when isLoading is true", () => {
		render(
			<ErrorBoundary isLoading={true} isError={false}>
				<div>Child content</div>
			</ErrorBoundary>
		);

		expect(screen.getByRole("progressbar")).toBeInTheDocument();
		expect(screen.queryByText("Child content")).not.toBeInTheDocument();
	});

	it("should render error message when isError is true", () => {
		render(
			<ErrorBoundary isLoading={false} isError={true}>
				<div>Child content</div>
			</ErrorBoundary>
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.queryByText("Child content")).not.toBeInTheDocument();
	});

	it("should render children when not loading and no error", () => {
		render(
			<ErrorBoundary isLoading={false} isError={false}>
				<div>Child content</div>
			</ErrorBoundary>
		);

		expect(screen.getByText("Child content")).toBeInTheDocument();
	});

	it("should prioritize loading state over error state", () => {
		render(
			<ErrorBoundary isLoading={true} isError={true}>
				<div>Child content</div>
			</ErrorBoundary>
		);

		expect(screen.getByRole("progressbar")).toBeInTheDocument();
		expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
	});
});
