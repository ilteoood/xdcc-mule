import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrimeReactProvider } from "@primereact/core";
import type React from "react";

export const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<PrimeReactProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</PrimeReactProvider>
	);
};
