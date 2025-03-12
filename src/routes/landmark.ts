import { Hono } from 'hono'
import fetchData from './fetchYahooData.ts'

const landmarkRouter = new Hono()

landmarkRouter.get('/', async (c) => {
  try {
    const jsonData = await fetchData() 
    return c.json(jsonData)
  } catch (error) {
    return c.text('データ取得に失敗しました。', 500)
  }
})

export default landmarkRouter
