import fastify from 'fastify'
import apiController from './routes/api.js'


const app = fastify()

app.register(apiController, {
    prefix: '/api'
})


await app.listen({ port: 3000 })