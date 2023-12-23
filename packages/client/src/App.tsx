import { Button } from "primereact/button"
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown"
import { useCallback, useState } from "react"
import { DownloadList } from "./components/DownloadList"
import { statusOptions } from "./services/downloads"

function App() {

  const [statusOption, setStatusOption] = useState()

  const onStatusChange = useCallback((event: DropdownChangeEvent) => {
    setStatusOption(event.value)
  }, [])

  return <>
    <div className='flex justify-content-between'>
      <div className='flex align-items-center'>
        <div className='mr-2'>
          Status:
        </div>
        <Dropdown value={statusOption} options={statusOptions} onChange={onStatusChange} />
      </div>

      <Button icon='pi pi-plus' />
    </div>
  <DownloadList />
  </>
}

export default App
