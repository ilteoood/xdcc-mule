import fastify from 'fastify'
import downloadsController from './routes/downloads.js'
import filesController from './routes/files.js'

const app = fastify()

app.register(filesController, {
    prefix: '/files'
})

app.register(downloadsController, {
    prefix: '/downloads'
})

await app.listen({ port: 3000 })