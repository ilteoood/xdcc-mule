import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Lara from "@primeuix/themes/lara";
import { PrimeReactProvider } from "@primereact/core";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<PrimeReactProvider theme={{ preset: Lara }}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</PrimeReactProvider>
	</React.StrictMode>,
);
