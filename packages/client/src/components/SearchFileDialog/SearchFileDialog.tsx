import { useBoolean } from "@fluentui/react-hooks";
import { useQuery } from "@tanstack/react-query";
import {
	Button,
	CloseButton,
	Dialog,
	Flex,
	HStack,
	Input,
	InputGroup,
	Portal,
	Stack,
} from "@chakra-ui/react";
import { File, Search } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useCallback, useState } from "react";
import { searchFile } from "../../services/files";
import { downloadableItem } from "../DownloadableItem/DownloadableItem";
import { ErrorBoundary } from "../ErrorBoundary";
import type { DownloadingFile } from "../../services/downloads";

import { DoubleIconButton } from "../DoubleIconButton/DoubleIconButton";

const FILE_OPTIONS = { action: "download" };

export const SearchFileDialog = () => {
	const [isVisible, { setTrue: setVisible, setFalse: setInvisible }] = useBoolean(false);
	const [fileName, setFileName] = useState("");

	const {
		data = [],
		isLoading,
		isError,
		isRefetching,
		isRefetchError,
		refetch,
	} = useQuery({
		queryKey: ["files"],
		queryFn: () => searchFile(fileName),
		enabled: false,
	});

	const ItemComponent = downloadableItem(FILE_OPTIONS);

	const onFileNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFileName(e.target.value), []);

	const onEnter = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				refetch();
			}
		},
		[refetch],
	);

	return (
		<>
			<DoubleIconButton aria-label="Search files" onClick={setVisible}>
				<File />
			</DoubleIconButton>
			<Dialog.Root open={isVisible} onOpenChange={(e) => !e.open && setInvisible()} size="lg" placement="center">
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content maxW="90%">
							<Dialog.Header>
								<Dialog.Title>Search file</Dialog.Title>
								<Dialog.CloseTrigger asChild>
									<CloseButton size="sm" aria-label="Close dialog">
										<Dialog.CloseTrigger />
									</CloseButton>
								</Dialog.CloseTrigger>
							</Dialog.Header>
							<Dialog.Body>
								<ErrorBoundary isLoading={isLoading || isRefetching} isError={isError || isRefetchError}>
									<Stack gap={2}>
										<Flex justifyContent="space-between" mb={2}>
											<InputGroup
												startElement={<File />}
												width="auto"
												flex={1}
												mr={2}
											>
												<Input
													value={fileName}
													placeholder="File name"
													onKeyDown={onEnter}
													onChange={onFileNameChange}
												/>
											</InputGroup>
											<Button disabled={!fileName} onClick={() => refetch()}>
												<HStack gap={1}>
													<Search />
													Search
												</HStack>
											</Button>
										</Flex>
										{fileName && (
											<Stack gap={2}>
												{data.map((file: DownloadingFile) => (
													<ItemComponent key={file.fileName} {...file} />
												))}
											</Stack>
										)}
									</Stack>
								</ErrorBoundary>
							</Dialog.Body>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
};