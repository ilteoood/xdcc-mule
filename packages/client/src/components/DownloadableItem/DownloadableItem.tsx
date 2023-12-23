import { useBoolean } from "@fluentui/react-hooks";
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { DownloadableFile, cancelDownload, downloadFile } from "../../services/downloads";

import { useCallback } from "react";
import style from './DownloadableItem.module.css';

interface DownloadableItemProps {
    action: string
}

const iconsMap: Record<string, string> = {
    'download': 'pi pi-download',
    'delete': 'pi pi-trash'
}

const buttonActionsMap: Record<string, (downloadableFile: DownloadableFile) => Promise<Response>> = {
    'download': (downloadableFile: DownloadableFile) => downloadFile(downloadableFile),
    'delete': (downloadableFile: DownloadableFile) => cancelDownload(downloadableFile)
}

export const downloadableItem = (props?: DownloadableItemProps) => (downloadableFile: DownloadableFile) => {
    const [isButtonEnabled, { setFalse: disableButton }] = useBoolean(false)

    const onButtonClick = useCallback(() => {
        disableButton()
        buttonActionsMap[props!.action](downloadableFile)
    }, [downloadableFile])

    return <div className={classNames(style.container, 'flex', 'flex-row', 'justify-content-between')}>
        <div>
            <div>Name: {downloadableFile.fileName}</div>
            <div>Location: {downloadableFile.network} - {downloadableFile.channelName} - {downloadableFile.botName}</div>
            <div>Package number: {downloadableFile.fileName}</div>
            <div>Size: {downloadableFile.fileSize}</div>
        </div>
        <div className='flex align-items-center gap-2'>
            {props?.action && <Button icon={iconsMap[props.action]} size='small' onClick={onButtonClick} />}
        </div>
    </div>
}