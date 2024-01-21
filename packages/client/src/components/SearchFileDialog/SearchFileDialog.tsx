import { useBoolean } from "@fluentui/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { DataView as PrimeReactDataView } from "primereact/dataview";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";
import { searchFile } from "../../services/files";
import { downloadableItem } from "../DownloadableItem/DownloadableItem";
import { ErrorBoundary } from "../ErrorBoundary";

import { DoubleIconButton } from "../DoubleIconButton/DoubleIconButton";
import style from "./SearchFileDialog.module.css";

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
			<DoubleIconButton icon="pi pi-file" onClick={setVisible} className="pi pi-search" />
			<Dialog header="Search file" visible={isVisible} onHide={setInvisible} className={style.dialogContainer}>
				<ErrorBoundary isLoading={isLoading || isRefetching} isError={isError || isRefetchError}>
					<div className="m-0">
						<div className="flex justify-content-between mb-2">
							<span className="p-input-icon-left">
								<i className="pi pi-file" />
								<InputText
									value={fileName}
									placeholder="File name"
									onKeyDownCapture={onEnter}
									onChange={onFileNameChange}
								/>
							</span>
							<Button disabled={!fileName} label="Search" icon="pi pi-search" onClick={() => refetch()} />
						</div>

						<PrimeReactDataView value={data} paginator rows={100} itemTemplate={downloadableItem(FILE_OPTIONS)} />
					</div>
				</ErrorBoundary>
			</Dialog>
		</>
	);
};
