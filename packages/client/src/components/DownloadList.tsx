import { useQuery } from "@tanstack/react-query";

import { type StatusOption, getDownloads } from "../services/downloads";
import { downloadableItem } from "./DownloadableItem/DownloadableItem";
import { ErrorBoundary } from "./ErrorBoundary";

const REFETCH_INTERVAL = 1000;
const FILE_OPTIONS = { action: "delete" };

interface DownloadListProps {
	statusOption?: StatusOption;
}

export const DownloadList = ({ statusOption }: DownloadListProps) => {
	const {
		data = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["downloads", statusOption],
		queryFn: () => getDownloads(statusOption),
		refetchInterval: REFETCH_INTERVAL,
	});

	const ItemComponent = downloadableItem(FILE_OPTIONS);

	return (
		<ErrorBoundary isLoading={isLoading} isError={isError}>
			<div data-scope="dataview">
				{data.map((file) => (
					<ItemComponent key={file.fileName} {...file} />
				))}
			</div>
		</ErrorBoundary>
	);
};
