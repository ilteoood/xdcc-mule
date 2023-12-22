import sqlite3 from 'sqlite3';
import { Agent, fetch, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

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
    const database = new sqlite3.Database(':memory:');

    return database.run('CREATE TABLE files (serverName TEXT, network TEXT, fileNumber TEXT, channelName TEXT, fileSize TEXT, fileName TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
}

let sqliteDb: sqlite3.Database

export const createDatabase = async (database: DatabaseContent[]) => {
    sqliteDb = createOramaInstance()

    const promises = database.map(async channel => {
        const { serverName, network } = channel
        const scriptContent = await retrieveScriptContent(channel.scriptUrl)

        const preparedStatement = sqliteDb.prepare('INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)')

        scriptContent.split('\n')
            .map(line => line.split(' ').filter(Boolean))
            .map(([fileNumber, channelName, fileSize, fileName]) => {
                preparedStatement.run(serverName, network, fileNumber, channelName, fileSize, fileName.trim())
            })

        preparedStatement.finalize()
    })

    await Promise.allSettled(promises)
}

export const searchInDatabase = async (value: string) => {
    if (!sqliteDb) {
        const xdccDatabase = await parseXdccDatabase()
        await createDatabase(xdccDatabase)
    }

    return new Promise((resolve) => {
        sqliteDb.all('SELECT * FROM files WHERE fileName LIKE ?', [`%${value}%`], (err, rows = []) => resolve(rows))
    })
}
