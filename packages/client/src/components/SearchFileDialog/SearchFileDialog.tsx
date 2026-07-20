import { useBoolean } from "@fluentui/react-hooks";
import { useQuery } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputText } from "primereact/inputtext";
import { type ChangeEvent, type KeyboardEvent, useCallback, useState } from "react";
import { searchFile } from "../../services/files";
import { downloadableItem } from "../DownloadableItem/DownloadableItem";
import { ErrorBoundary } from "../ErrorBoundary";
import type { DownloadingFile } from "../../services/downloads";

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
			<DoubleIconButton icon="pi pi-file" onClick={setVisible} className="pi pi-search" />
			<Dialog.Root open={isVisible} onOpenChange={(e: { value: boolean | undefined }) => !e.value && setInvisible()}>
				<Dialog.Portal>
					<Dialog.Popup className={style.dialogContainer}>
						<Dialog.Header>
							<Dialog.Title>Search file</Dialog.Title>
							<Dialog.Close aria-label="Close" icon="pi pi-times" />
						</Dialog.Header>
						<ErrorBoundary isLoading={isLoading || isRefetching} isError={isError || isRefetchError}>
							<div className="m-0">
								<div className="flex justify-content-between mb-2">
									<IconField.Root iconPosition="left">
										<IconField.Inset className="pi pi-file" />
										<InputText
											value={fileName}
											placeholder="File name"
											onKeyDownCapture={onEnter}
											onChange={onFileNameChange}
										/>
									</IconField.Root>
									<Button disabled={!fileName} icon="pi pi-search" onClick={() => refetch()}>
										Search
									</Button>
								</div>
								{fileName && (
									<div data-scope="dataview">
										{data.map((file: DownloadingFile) => (
											<ItemComponent key={file.fileName} {...file} />
										))}
									</div>
								)}
							</div>
						</ErrorBoundary>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
};
