import { Dropdown, DropdownChangeEvent } from "primereact/dropdown"
import { useCallback, useState } from "react"
import { DownloadList } from "./components/DownloadList"
import { SearchFileDialog } from "./components/SearchFileDialog/SearchFileDialog"
import { statusOptions } from "./services/downloads"

function App() {
  const [statusOption, setStatusOption] = useState()

  const onStatusChange = useCallback((event: DropdownChangeEvent) => {
    setStatusOption(event.value)
  }, [])

  return <>
    <div className='flex justify-content-between'>
      <div className='flex align-items-center mb-2'>
        <div className='mr-2'>
          Status:
        </div>
        <Dropdown value={statusOption} options={statusOptions} onChange={onStatusChange} />
      </div>

      <SearchFileDialog />
    </div>
  <DownloadList />
  </>
}

export default App
