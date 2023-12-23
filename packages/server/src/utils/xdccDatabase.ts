import sqlite3 from 'sqlite3';
import { Agent, fetch, setGlobalDispatcher } from 'undici';

setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

type DatabaseContent = {
    channelName: string
    scriptUrl: string
    network: string
}

const COLUMNS_PER_FILE = 4

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
            const [channelName, scriptUrl] = line.split('*')

            extractedChannels.push({
                channelName,
                scriptUrl,
                network: parsedNetwrok
            })
        }
    }

    return extractedChannels
}

export const parse = async () => {
    const databaseContent = await retrieveDatabaseContent()

    return extractDatabaseInfo(databaseContent)
}

const retrieveScriptContent = async (scriptUrl: string) => {
    const scriptContent = await fetch(scriptUrl)
    return scriptContent.text()
}

const createDbInstance = () => {
    const database = new sqlite3.Database(':memory:');

    return database.run('CREATE TABLE files (channelName TEXT, network TEXT, fileNumber TEXT, botName TEXT, fileSize TEXT, fileName TEXT)');
}

let sqliteDb: sqlite3.Database

export const create = async (database: DatabaseContent[]) => {
    sqliteDb = createDbInstance()

    const promises = database.map(async channel => {
        const { channelName, network } = channel
        const scriptContent = await retrieveScriptContent(channel.scriptUrl)

        const preparedStatement = sqliteDb.prepare('INSERT INTO files VALUES (?, ?, ?, ?, ?, ?)')

        scriptContent.split('\n')
            .map(line => line.split(' ').filter(Boolean))
            .filter(file => file.filter(Boolean).length === COLUMNS_PER_FILE)
            .forEach(([fileNumber, botName, fileSize, fileName]) => {
                preparedStatement.run(channelName, network, fileNumber, botName, fileSize, fileName.trim())
            })

        preparedStatement.finalize()
    })

    await Promise.allSettled(promises)
}

export const search = async (value: string) => {
    if (!sqliteDb) {
        const xdccDatabase = await parse()
        await create(xdccDatabase)
    }

    return new Promise((resolve) => {
        sqliteDb.all('SELECT * FROM files WHERE fileName LIKE ?', [`%${value}%`], (err, rows = []) => resolve(rows))
    })
}
