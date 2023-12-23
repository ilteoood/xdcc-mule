import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface ErrorBoundaryProps {
	isLoading: boolean;
	isError: boolean;
	children: React.ReactNode;
}

const ErrorMessage = () => (
	<Message severity="error" text="Something went wrong" />
);

export const ErrorBoundary = ({
	children,
	isLoading,
	isError,
}: ErrorBoundaryProps) => {
	if (isLoading) {
		return (
			<div className="flex justify-content-center">
				<ProgressSpinner />
			</div>
		);
	}

	if (isError) {
		return <ErrorMessage />;
	}

	return (
		<ReactErrorBoundary fallback={<ErrorMessage />}>
			{children}
		</ReactErrorBoundary>
	);
};
