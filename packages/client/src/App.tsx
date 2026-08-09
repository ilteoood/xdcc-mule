import { useMutation } from "@tanstack/react-query";
import { Box, createListCollection, Flex, HStack, Portal, Select } from "@chakra-ui/react";
import { Database } from "lucide-react";
import { useCallback, useState } from "react";
import { DownloadList } from "./components/DownloadList";
import { DoubleIconButton } from "./components/DoubleIconButton/DoubleIconButton";
import { SearchFileDialog } from "./components/SearchFileDialog/SearchFileDialog";
import { type StatusOption, statusOptions } from "./services/downloads";
import { refreshDatabase } from "./services/files";

const dropdownOptions = createListCollection({
	items: statusOptions.map((option) => ({ label: option, value: option })),
});

function App() {
	const [statusOption, setStatusOption] = useState<StatusOption>();

	const onStatusChange = useCallback((details: { value: string[] }) => {
		setStatusOption(details.value[0] as StatusOption);
	}, []);

	const { isPending, mutate } = useMutation({ mutationFn: refreshDatabase });

	return (
		<Box maxW="6xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
			<Flex
				justifyContent="space-between"
				alignItems={{ base: "stretch", md: "center" }}
				direction={{ base: "column", md: "row" }}
				gap={3}
				mb={4}
			>
				<Flex
					alignItems="center"
					gap={2}
					direction={{ base: "column", md: "row" }}
					align={{ base: "flex-start", md: "center" }}
					w={{ base: "100%", md: "auto" }}
				>
					<Box alignSelf="flex-start">Status:</Box>
					<Select.Root
						collection={dropdownOptions}
						value={statusOption ? [statusOption] : []}
						onValueChange={onStatusChange}
						width={{ base: "100%", md: "200px" }}
					>
						<Select.HiddenSelect />
						<Select.Control>
							<Select.Trigger>
								<Select.ValueText placeholder="Select status" />
							</Select.Trigger>
							<Select.IndicatorGroup>
								<Select.Indicator />
							</Select.IndicatorGroup>
						</Select.Control>
						<Portal>
							<Select.Positioner>
								<Select.Content>
									<Select.List>
										{dropdownOptions.items.map((option) => (
											<Select.Item key={option.value} item={option}>
												<Select.ItemText>{option.label}</Select.ItemText>
												<Select.ItemIndicator />
											</Select.Item>
										))}
									</Select.List>
								</Select.Content>
							</Select.Positioner>
						</Portal>
					</Select.Root>
				</Flex>

				<HStack gap={2}>
					<DoubleIconButton
						aria-label="Refresh database"
						colorPalette="red"
						disabled={isPending}
						onClick={mutate as () => void}
					>
						<Database />
					</DoubleIconButton>

					<SearchFileDialog />
				</HStack>
			</Flex>
			<DownloadList statusOption={statusOption} />
		</Box>
	);
}

export default App;