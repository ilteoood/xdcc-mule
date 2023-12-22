import fastify from 'fastify'
import fileController from './routes/file'

const app = fastify()

app.register(fileController, {
    prefix: '/file'
})

await app.listen({ port: 3000 })