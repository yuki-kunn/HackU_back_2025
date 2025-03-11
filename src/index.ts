import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import landmarkRouter from './routes/landmark.ts'

const app = new Hono()

app.route('/landmark', landmarkRouter)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

export default app