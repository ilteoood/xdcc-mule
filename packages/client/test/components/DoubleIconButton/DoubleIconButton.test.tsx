import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DoubleIconButton } from "../../../src/components/DoubleIconButton/DoubleIconButton";
import { createWrapper } from "../../utils/testWrapper";

describe("DoubleIconButton", () => {
	it("should render button with icon prop", () => {
		render(<DoubleIconButton icon="pi pi-database" />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
	});

	it("should pass through className prop combined with style", () => {
		render(<DoubleIconButton icon="pi pi-database" className="pi pi-times" />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toHaveClass("pi");
		expect(button).toHaveClass("pi-times");
	});

	it("should pass through onClick handler", () => {
		const handleClick = vi.fn();
		render(<DoubleIconButton icon="pi pi-database" onClick={handleClick} />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should pass through disabled prop", () => {
		render(<DoubleIconButton icon="pi pi-database" disabled />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});

	it("should pass through severity prop", () => {
		render(<DoubleIconButton icon="pi pi-database" severity="danger" />, { wrapper: createWrapper() });

		const button = screen.getByRole("button");
		expect(button.getAttribute("data-scope")).toBe("button");
	});
});
