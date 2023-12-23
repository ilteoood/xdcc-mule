import { useQuery } from '@tanstack/react-query'
import { DataView } from 'primereact/dataview'

import { DownloadingFile, StatusOption, getDownloads } from '../services/downloads'
import { downloadableItem } from './DownloadableItem/DownloadableItem'
import { ErrorBoundary } from './ErrorBoundary'

const REFETCH_INTERVAL = 5_000
const FILE_OPTIONS = { action: 'delete' }

interface DownloadableItemProps {
    statusOption?: StatusOption
}

const filterPerStatus = (status?: StatusOption) => (downloads: DownloadingFile[]) => {
    return status ? downloads.filter(download => download.status === status) : downloads
}

export const DownloadList = ({ statusOption }: DownloadableItemProps) => {
    const { data = [], isLoading, isError } = useQuery({
        queryKey: ['downloads', statusOption],
        queryFn: () => getDownloads().then(filterPerStatus(statusOption)),
        refetchInterval: REFETCH_INTERVAL
    })

    return <ErrorBoundary isLoading={isLoading} isError={isError}>
        <DataView value={data} itemTemplate={downloadableItem(FILE_OPTIONS)} />
    </ErrorBoundary>
}