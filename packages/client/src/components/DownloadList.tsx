import { useQuery } from '@tanstack/react-query'
import { DataView } from 'primereact/dataview'

import { getDownloads } from '../services/downloads'
import { DownloadableItem } from './DownloadableItem/DownloadableItem'
import { ErrorBoundary } from './ErrorBoundary'

const REFETCH_INTERVAL = 5_000

export const DownloadList = () => {
    const { data = [], isLoading, isError } = useQuery({ queryKey: ['downloads'], queryFn: getDownloads, refetchInterval: REFETCH_INTERVAL })

    return <ErrorBoundary isLoading={isLoading} isError={isError}>
        <DataView value={data} itemTemplate={DownloadableItem} />
    </ErrorBoundary>
}