import { useQuery } from "@tanstack/react-query";
import { Stack } from "@chakra-ui/react";

import { type StatusOption, getDownloads } from "../services/downloads";
import { DownloadableItem } from "./DownloadableItem/DownloadableItem";
import { ErrorBoundary } from "./ErrorBoundary";

const REFETCH_INTERVAL = 1000;
const FILE_OPTIONS = "delete";

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

	return (
		<ErrorBoundary isLoading={isLoading} isError={isError}>
			<Stack gap={2}>
				{data.map((file) => (
					<DownloadableItem key={file.fileName} action={FILE_OPTIONS} {...file} />
				))}
			</Stack>
		</ErrorBoundary>
	);
};