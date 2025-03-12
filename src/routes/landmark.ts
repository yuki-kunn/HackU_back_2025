import { Hono } from 'hono'
import fetchData from './fetchYahooData.ts'

const landmarkRouter = new Hono()

landmarkRouter.get('/', async (c) => {
  try {
    // クエリパラメータから位置情報を取得
    const lat = c.req.query('lat')
    const lng = c.req.query('lng')
    const radius = c.req.query('radius') || '1000' // デフォルト1km

    if (!lat || !lng) {
      return c.json({ error: 'Latitude and longitude are required' }, 400)
    }

    const jsonData = await fetchData(lat, lng, radius)
    return c.json(jsonData)
  } catch (error) {
    console.error('Error:', error)
    return c.json({ error: 'Failed to fetch landmarks' }, 500)
  }
})

export default landmarkRouter
