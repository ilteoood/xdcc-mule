import { useMutation } from "@tanstack/react-query";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useCallback, useState } from "react";
import { DoubleIconButton } from "./components/DoubleIconButton/DoubleIconButton";
import { DownloadList } from "./components/DownloadList";
import { SearchFileDialog } from "./components/SearchFileDialog/SearchFileDialog";
import { StatusOption, statusOptions } from "./services/downloads";
import { refreshDatabase } from "./services/files";

function App() {
	const [statusOption, setStatusOption] = useState<StatusOption>();

	const onStatusChange = useCallback((event: DropdownChangeEvent) => {
		setStatusOption(event.value);
	}, []);

	const { isPending, mutate } = useMutation({ mutationFn: refreshDatabase });

	return (
		<>
			<div className="flex justify-content-between">
				<div className="flex align-items-center mb-2">
					<div className="mr-2">Status:</div>
					<Dropdown value={statusOption} options={statusOptions} onChange={onStatusChange} showClear />
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
