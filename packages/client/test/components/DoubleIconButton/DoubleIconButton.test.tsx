import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DoubleIconButton } from "../../../src/components/DoubleIconButton/DoubleIconButton";
import { createWrapper } from "../../utils/testWrapper";

describe("DoubleIconButton", () => {
	it("should render button with aria-label", () => {
		render(<DoubleIconButton aria-label="Database" />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /database/i });
		expect(button).toBeInTheDocument();
	});

	it("should render children inside the button", () => {
		render(<DoubleIconButton aria-label="Refresh">×</DoubleIconButton>, { wrapper: createWrapper() });

		expect(screen.getByText("×")).toBeInTheDocument();
	});

	it("should pass through onClick handler", () => {
		const handleClick = vi.fn();
		render(<DoubleIconButton aria-label="Refresh" onClick={handleClick} />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /refresh/i });
		button.click();

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should pass through disabled prop", () => {
		render(<DoubleIconButton aria-label="Refresh" disabled />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /refresh/i });
		expect(button).toBeDisabled();
	});

	it("should pass through colorPalette prop", () => {
		render(<DoubleIconButton aria-label="Refresh" colorPalette="red" />, { wrapper: createWrapper() });

		const button = screen.getByRole("button", { name: /refresh/i });
		expect(button).toBeInTheDocument();
	});
});