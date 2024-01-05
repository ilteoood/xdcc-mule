import { useBoolean } from "@fluentui/react-hooks";
import { Button, ButtonProps } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { classNames } from "primereact/utils";
import { useCallback } from "react";

import { DownloadableFile, DownloadingFile, cancelDownload, downloadFile } from "../../services/downloads";

import style from "./DownloadableItem.module.css";

interface DownloadableItemProps {
	action: string;
}

const iconsMap: Record<string, string> = {
	download: "pi pi-download",
	delete: "pi pi-trash",
};

const buttonActionsMap: Record<string, (downloadableFile: DownloadableFile) => Promise<Response>> = {
	download: (downloadableFile: DownloadableFile) => downloadFile(downloadableFile),
	delete: (downloadableFile: DownloadableFile) => cancelDownload(downloadableFile),
};

const styleMap: Record<string, ButtonProps["severity"]> = {
	delete: "danger",
};

export const downloadableItem =
	(props: DownloadableItemProps) => (downloadableFile: DownloadableFile & DownloadingFile) => {
		const [isButtonDisabled, { setTrue: disableButton }] = useBoolean(false);

		const onButtonClick = useCallback(() => {
			disableButton();
			buttonActionsMap[props.action](downloadableFile);
		}, [props, disableButton, downloadableFile]);

		return (
			<div className={classNames(style.container, "flex", "flex-column")}>
				<div className="flex flex-row justify-content-between">
					<div>
						<div>Name: {downloadableFile.fileName}</div>
						<div>
							Location: {downloadableFile.network} - {downloadableFile.channelName} - {downloadableFile.botName}
						</div>
						<div>Package number: {downloadableFile.fileNumber}</div>
						<div>Size: {downloadableFile.fileSize}</div>
						{downloadableFile.status && <div>Status: {downloadableFile.status}</div>}
					</div>
					<div className="flex align-items-center gap-2">
						{props?.action && (
							<Button
								disabled={isButtonDisabled}
								icon={iconsMap[props.action]}
								severity={styleMap[props.action]}
								size="small"
								onClick={onButtonClick}
							/>
						)}
					</div>
				</div>
				{downloadableFile.percentage > 0 && (
					<ProgressBar className="mt-2" value={downloadableFile.percentage.toFixed(2)} />
				)}
			</div>
		);
	};
