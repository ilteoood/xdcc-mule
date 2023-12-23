import { useQuery } from '@tanstack/react-query'
import { DataView } from 'primereact/dataview'

import { DownloadableFile, getDownloads } from '../services/downloads'
import { ErrorBoundary } from './ErrorBoundary'

const itemTemplate = (downloadableFile: DownloadableFile) => {
    return <div>
        <div>{downloadableFile.fileName}</div>
        <div>{downloadableFile.fileNumber}</div>
        <div>{downloadableFile.network}</div>
        <div>{downloadableFile.channelName}</div>
        <div>{downloadableFile.botName}</div>
        <div>{downloadableFile.fileSize}</div>
    </div>
}

export const DownloadList = () => {
    const { data = [], isLoading, isError } = useQuery({ queryKey: ['downloads'], queryFn: getDownloads })

    return <ErrorBoundary isLoading={isLoading} isError={isError}>
        <DataView value={data} itemTemplate={itemTemplate} />
    </ErrorBoundary>
}