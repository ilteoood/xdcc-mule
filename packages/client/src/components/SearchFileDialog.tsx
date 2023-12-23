import { useBoolean } from '@fluentui/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ChangeEvent, useCallback, useState } from 'react';
import { searchFile } from '../services/files';
import { ErrorBoundary } from './ErrorBoundary';

export const SearchFileDialog = () => {
    const [isVisible, { setTrue: setVisible, setFalse: setInvisible }] = useBoolean(false)
    const [fileName, setFileName] = useState('')

    const {
        data = [],
        isLoading,
        isError,
        isRefetching,
        isRefetchError,
        refetch
    } = useQuery({ queryKey: ['files'], queryFn: () => searchFile(fileName), enabled: false })

    const onFileNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setFileName(e.target.value)
    }, [])

    const dialogStyle = { width: data.length > 0 ? '90%' : '50%' }

    return <>
        <Button icon='pi pi-plus' onClick={setVisible} />
        <Dialog header="Search file" visible={isVisible} onHide={setInvisible} style={dialogStyle} breakpoints={{ '960px': '75vw', '641px': '100vw' }}>
            <ErrorBoundary isLoading={isLoading || isRefetching} isError={isError || isRefetchError}>
                <p className="m-0">
                    <div className='flex justify-content-between'>
                        <span className="p-input-icon-left">
                            <i className="pi pi-file" />
                            <InputText value={fileName} placeholder='File name' onChange={onFileNameChange} />
                        </span>
                        <Button label="Search" icon="pi pi-search" onClick={() => refetch()} />
                    </div>
                </p>
            </ErrorBoundary>
        </Dialog >
    </>
}