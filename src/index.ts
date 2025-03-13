import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import landmarkRouter from './routes/landmark.ts'
import questRouter from './routes/quest.ts'

const app = new Hono()

// CORSミドルウェアを追加
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'], // フロントエンドのURL
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true
}))

app.route('/landmark', landmarkRouter)
app.route('/quest', questRouter)

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