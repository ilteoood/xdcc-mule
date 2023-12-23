import { useQuery } from '@tanstack/react-query'
import { DataView } from 'primereact/dataview'

import { getDownloads } from '../services/downloads'
import { DownloadableItem } from './DownloadableItem/DownloadableItem'
import { ErrorBoundary } from './ErrorBoundary'

export const DownloadList = () => {
    const { data = [], isLoading, isError } = useQuery({ queryKey: ['downloads'], queryFn: getDownloads })

    return <ErrorBoundary isLoading={isLoading} isError={isError}>
        <DataView value={data} itemTemplate={DownloadableItem} />
    </ErrorBoundary>
}