import { Alert, Center, Spinner } from "@chakra-ui/react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface ErrorBoundaryProps {
	isLoading: boolean;
	isError: boolean;
	children: React.ReactNode;
}

const ErrorMessage = () => (
	<Alert.Root status="error">
		<Alert.Indicator />
		<Alert.Title>Something went wrong</Alert.Title>
	</Alert.Root>
);

export const ErrorBoundary = ({ children, isLoading, isError }: ErrorBoundaryProps) => {
	if (isLoading) {
		return (
			<Center>
				<Spinner role="status" />
			</Center>
		);
	}

	if (isError) {
		return <ErrorMessage />;
	}

	return <ReactErrorBoundary fallback={<ErrorMessage />}>{children}</ReactErrorBoundary>;
};