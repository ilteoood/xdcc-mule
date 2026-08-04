import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

import { Provider } from "../../src/components/ui/provider";

export const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<Provider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</Provider>
	);
};