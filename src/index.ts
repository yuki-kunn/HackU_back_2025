import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import landmarkRouter from './routes/landmarkRouter.ts'
import questRouter from './routes/quest.ts'
import fetchLandmarks from './routes/fetchLandmarks.ts'
import acceptQuest from './routes/acceptQuest.ts'
import getQuests from './routes/getQuests.ts'
import deleteQuest from './routes/deleteQuest.ts'
import getAllLandmarks from './routes/getAllLandmarks.ts'
import updateUserLocation from './routes/updateUserLocation.ts'  // 追加

const app = new Hono()

// CORSミドルウェアを追加
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', '*'], // フロントエンドのURL
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true
}))

app.route('/landmark', landmarkRouter)
app.route('/quest', questRouter)
app.route('/landmarks', fetchLandmarks)
app.route('/quests', acceptQuest)
app.route('/quests', getQuests)
app.route('/quests', deleteQuest)
app.route('/all-landmarks', getAllLandmarks)
app.route('/user-location', updateUserLocation)  // 追加

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