import { useBoolean } from "@fluentui/react-hooks";
import { Flex, HStack, IconButton, Progress, Stack } from "@chakra-ui/react";
import { Download, Trash2 } from "lucide-react";
import prettyMilliseconds from "pretty-ms";
import { type ComponentProps, useCallback } from "react";

import { type DownloadableFile, type DownloadingFile, cancelDownload, downloadFile } from "../../services/downloads";

interface DownloadableItemProps extends DownloadableFile {
	action: string;
	status?: DownloadingFile["status"];
	percentage?: number;
	eta?: number;
}

type IconButtonProps = NonNullable<ComponentProps<typeof IconButton>>;

const iconsMap: Record<string, React.ReactNode> = {
	download: <Download />,
	delete: <Trash2 />,
};

const buttonActionsMap: Record<string, (downloadableFile: DownloadableFile) => Promise<Response>> = {
	download: (downloadableFile: DownloadableFile) => downloadFile(downloadableFile),
	delete: (downloadableFile: DownloadableFile) => cancelDownload(downloadableFile),
};

const styleMap: Record<string, IconButtonProps["colorPalette"]> = {
	delete: "red",
};

export const DownloadableItem = (props: DownloadableItemProps) => {
	const { action, ...downloadableFile } = props;
	const [isButtonDisabled, { setTrue: disableButton }] = useBoolean(false);

	const onButtonClick = useCallback(() => {
		disableButton();
		const { action: _action, ...file } = props;
		buttonActionsMap[props.action](file);
	}, [disableButton, props]);

	return (
		<Stack width="100%">
			<Flex justifyContent="space-between" alignItems="center">
				<Stack gap={0}>
					<div>Name: {downloadableFile.fileName}</div>
					<div>
						Location: {downloadableFile.network} - {downloadableFile.channelName} - {downloadableFile.botName}
					</div>
					<div>Package number: {downloadableFile.fileNumber}</div>
					<div>Size: {downloadableFile.fileSize}</div>
					{downloadableFile.status && <div>Status: {downloadableFile.status}</div>}
					{Number(downloadableFile.eta) > 0 && <div>ETA: {prettyMilliseconds(Number(downloadableFile.eta))}</div>}
				</Stack>
				<HStack gap={2} alignItems="center">
					{action && (
						<IconButton
							aria-label={action}
							disabled={isButtonDisabled}
							colorPalette={styleMap[action]}
							size="sm"
							onClick={onButtonClick}
						>
							{iconsMap[action]}
						</IconButton>
					)}
				</HStack>
			</Flex>
			{Number(downloadableFile.percentage) > 0 && (
				<Progress.Root mt={2} value={Number(Number(downloadableFile.percentage).toFixed(1))}>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
					<Progress.Label>{`${Number(downloadableFile.percentage).toFixed(1)}%`}</Progress.Label>
				</Progress.Root>
			)}
		</Stack>
	);
};
