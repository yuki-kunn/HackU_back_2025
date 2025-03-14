import { Hono } from 'hono'
// 修正した版を使用する
import fetchData from './fetchYahooDataImproved.ts'

const landmarkRouter = new Hono()

landmarkRouter.get('/', async (c) => {
  try {
    // クエリパラメータから位置情報を取得
    const lat = c.req.query('lat')
    const lng = c.req.query('lng') || c.req.query('lon') // lng または lon どちらも受け入れる
    const radius = c.req.query('radius') || '1000' // デフォルト1km

    if (!lat || !lng) {
      return c.json({ error: 'Latitude and longitude are required' }, 400)
    }

    console.log(`Fetching landmarks for lat=${lat}, lng=${lng}, radius=${radius}`)

    // Yahooからデータ取得してDBに保存
    const jsonData = await fetchData(lat, lng, radius)

    return c.json({ message: 'Landmarks fetched and saved successfully', landmarks: jsonData })
  } catch (error) {
    console.error('Error in landmarkRouter:', error)
    return c.json({ error: 'Failed to fetch landmarks' }, 500)
  }
})

export default landmarkRouter