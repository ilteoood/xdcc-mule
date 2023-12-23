import { DownloadableFile } from "../../services/downloads"

import style from './DownloadableItem.module.css'

export const DownloadableItem = (downloadableFile: DownloadableFile) => {
    return <div className={style.container}>
        <div>Name: {downloadableFile.fileName}</div>
        <div>Location: {downloadableFile.network} - {downloadableFile.channelName} - {downloadableFile.botName}</div>
        <div>Package number: {downloadableFile.fileName}</div>
        <div>Size: {downloadableFile.fileSize}</div>
    </div>
}