import { useBoolean } from '@fluentui/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { DataView } from 'primereact/dataview';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ChangeEvent, useCallback, useState } from 'react';
import { searchFile } from '../../services/files';
import { downloadableItem } from '../DownloadableItem/DownloadableItem';
import { ErrorBoundary } from '../ErrorBoundary';

import { classNames } from 'primereact/utils';
import style from './SearchFileDialog.module.css';

const FILE_OPTIONS = { action: 'download' }

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

    const onFileNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setFileName(e.target.value), [])

    return <>
        <Button icon='pi pi-file' className={classNames(style.withoutLabel, 'pi', 'pi-search')} onClick={setVisible} />
        <Dialog header="Search file" visible={isVisible} onHide={setInvisible} className={style.dialogContainer}>
            <ErrorBoundary isLoading={isLoading || isRefetching} isError={isError || isRefetchError}>
                <p className="m-0">
                    <div className='flex justify-content-between mb-2'>
                        <span className="p-input-icon-left">
                            <i className="pi pi-file" />
                            <InputText value={fileName} placeholder='File name' onChange={onFileNameChange} />
                        </span>
                        <Button label="Search" icon="pi pi-search" onClick={() => refetch()} />
                    </div>

                    <DataView value={data} itemTemplate={downloadableItem(FILE_OPTIONS)} />
                </p>
            </ErrorBoundary>
        </Dialog >
    </>
}