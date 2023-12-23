import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { useCallback, useState } from "react";
import { DownloadList } from "./components/DownloadList";
import { SearchFileDialog } from "./components/SearchFileDialog/SearchFileDialog";
import { StatusOption, statusOptions } from "./services/downloads";

function App() {
	const [statusOption, setStatusOption] = useState<StatusOption>();

	const onStatusChange = useCallback((event: DropdownChangeEvent) => {
		setStatusOption(event.value);
	}, []);

	return (
		<>
			<div className="flex justify-content-between">
				<div className="flex align-items-center mb-2">
					<div className="mr-2">Status:</div>
					<Dropdown
						value={statusOption}
						options={statusOptions}
						onChange={onStatusChange}
						showClear
					/>
				</div>

				<SearchFileDialog />
			</div>
			<DownloadList statusOption={statusOption} />
		</>
	);
}

export default App;
