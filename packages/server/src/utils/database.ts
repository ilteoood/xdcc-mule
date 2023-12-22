import { create, insert, search } from '@orama/orama'

type DatabaseContent = {
    serverName: string
    scriptUrl: string
    network: string
}

type DownloadableFile = {
    serverName: string,
    network: string,
    fileNumber: string,
    channelName: string,
    fileSize: string,
    fileName: string,
}

const retrieveDatabaseContent = async () => {
    const databaseContent = await fetch(process.env.DATABASE_URL)
    return databaseContent.text()
}

const extractDatabaseInfo = (databaseContent: string): DatabaseContent[] => {
    const extractedChannels: DatabaseContent[] = []

    let parsedNetwrok: string = ''

    for (let line of databaseContent.split('\n')) {
        if (line.startsWith('0=')) {
            parsedNetwrok = line.split('*')[1]
        } else if (line && !line.startsWith('[')) {
            line = line.split('=')[1]
            const [serverName, scriptUrl] = line.split('*')

            extractedChannels.push({
                serverName,
                scriptUrl,
                network: parsedNetwrok
            })
        }
    }

    return extractedChannels
}

export const parseXdccDatabase = async () => {
    const databaseContent = await retrieveDatabaseContent()

    return extractDatabaseInfo(databaseContent)
}

const retrieveScriptContent = async (scriptUrl: string) => {
    const scriptContent = await fetch(scriptUrl)
    return scriptContent.text()
}

const createOramaInstance = () => {
    return create<DownloadableFile>({
        schema: {
            serverName: 'string',
            network: 'string',
            fileNumber: 'string',
            channelName: 'string',
            fileSize: 'string',
            fileName: 'string',
        }
    })
}

let oramaDb

export const createDatabase = async (database: DatabaseContent[]) => {
    oramaDb = await createOramaInstance()

    for (const channel of database) {
        const { serverName, network } = channel
        const scriptContent = await retrieveScriptContent(channel.scriptUrl).catch(() => '')

        const documentsToInsert = scriptContent.split('\n')
            .map(line => line.split(' ').filter(Boolean))
            .map(([fileNumber, channelName, fileSize, fileName]) => ({
                serverName,
                network,
                fileNumber,
                channelName,
                fileSize,
                fileName
            }))

        await insert(oramaDb, documentsToInsert)
    }
}

export const searchInDatabase = async (value: string) => {
    if (!oramaDb) {
        const xdccDatabase = await parseXdccDatabase()
        await createDatabase(xdccDatabase)
    }

    return search(oramaDb, { term: value }).then(result => result.hits.map(hit => hit.document))
}
