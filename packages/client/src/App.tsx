import { useMutation } from "@tanstack/react-query";
import { Select } from "primereact/select";
import { useCallback, useState } from "react";
import { DoubleIconButton } from "./components/DoubleIconButton/DoubleIconButton";
import { DownloadList } from "./components/DownloadList";
import { SearchFileDialog } from "./components/SearchFileDialog/SearchFileDialog";
import { type StatusOption, statusOptions } from "./services/downloads";
import { refreshDatabase } from "./services/files";

const dropdownOptions = statusOptions.map((option) => ({ label: option, value: option }));

function App() {
	const [statusOption, setStatusOption] = useState<StatusOption>();

	const onStatusChange = useCallback((event: { value: unknown }) => {
		setStatusOption(event.value as StatusOption);
	}, []);

	const { isPending, mutate } = useMutation({ mutationFn: refreshDatabase });

	return (
		<>
			<div className="flex justify-content-between">
				<div className="flex align-items-center mb-2">
					<div className="mr-2">Status:</div>
					<Select.Root
						value={statusOption}
						onValueChange={onStatusChange}
						options={dropdownOptions}
						optionLabel="label"
						optionValue="value"
					>
						<Select.Trigger>
							<Select.Value placeholder="Select status" />
						</Select.Trigger>
						<Select.Portal>
							<Select.Popup>
								<Select.List />
							</Select.Popup>
						</Select.Portal>
					</Select.Root>
				</div>

				<div className="flex gap-2">
					<DoubleIconButton
						icon="pi pi-database"
						severity="danger"
						className="pi pi-times"
						onClick={mutate as () => void}
						disabled={isPending}
					/>

					<SearchFileDialog />
				</div>
			</div>
			<DownloadList statusOption={statusOption} />
		</>
	);
}

export default App;
