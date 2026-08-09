import { useBoolean } from "@fluentui/react-hooks";
import {
	Badge,
	Box,
	Flex,
	HStack,
	Heading,
	IconButton,
	Progress,
	Separator,
	Stack,
	Text,
} from "@chakra-ui/react";
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

const buttonPaletteMap: Record<string, IconButtonProps["colorPalette"]> = {
	delete: "red",
};

const statusPaletteMap: Record<string, IconButtonProps["colorPalette"]> = {
	pending: "gray",
	downloading: "blue",
	downloaded: "green",
	error: "red",
	cancelled: "orange",
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
		<Box bg="bg.panel" borderWidth="1px" borderColor="border.subtle" borderRadius="md" p={4}>
			<Flex justifyContent="space-between" alignItems="flex-start" gap={3}>
				<Stack gap={2} flex={1} minW={0}>
					<Heading size="sm" truncate fontWeight="semibold">
						{downloadableFile.fileName}
					</Heading>

					<HStack gap={2} color="fg.muted" fontSize="xs" fontFamily="mono" flexWrap="wrap">
						<Text>{downloadableFile.network}</Text>
						<Separator orientation="vertical" height="3" />
						<Text>{downloadableFile.channelName}</Text>
						<Separator orientation="vertical" height="3" />
						<Text>{downloadableFile.botName}</Text>
						<Separator orientation="vertical" height="3" />
						<Text>#{downloadableFile.fileNumber}</Text>
					</HStack>

					<HStack gap={3} fontSize="xs" fontFamily="mono" color="fg.muted" alignItems="center" flexWrap="wrap">
						<Text>{downloadableFile.fileSize}</Text>
						{downloadableFile.status && (
							<Badge
								colorPalette={statusPaletteMap[downloadableFile.status] ?? "gray"}
								variant="subtle"
								size="sm"
								textTransform="lowercase"
							>
								{downloadableFile.status}
							</Badge>
						)}
						{Number(downloadableFile.eta) > 0 && (
							<Text>ETA {prettyMilliseconds(Number(downloadableFile.eta))}</Text>
						)}
					</HStack>
				</Stack>

				{action && (
					<IconButton
						aria-label={action}
						disabled={isButtonDisabled}
						colorPalette={buttonPaletteMap[action]}
						size="sm"
						variant="ghost"
						onClick={onButtonClick}
					>
						{iconsMap[action]}
					</IconButton>
				)}
			</Flex>

			{Number(downloadableFile.percentage) > 0 && (
				<Progress.Root mt={3} size="xs" value={Number(Number(downloadableFile.percentage).toFixed(1))}>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
					<Progress.Label fontFamily="mono">{`${Number(downloadableFile.percentage).toFixed(1)}%`}</Progress.Label>
				</Progress.Root>
			)}
		</Box>
	);
};