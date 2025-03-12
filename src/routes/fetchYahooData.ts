import axios from 'axios'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config()

const API_KEY = process.env.YAHOO_API_KEY
const AREA_CODE = '27' 
const OUTPUT_FILE = './osaka_buildings.csv'

const fetchData = async () => {
  try {
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        ac: AREA_CODE,
        output: 'json',
        sort: 'dist', // 距離順でソート
        results: 50 // 最大取得件数
      }
    })

    const data = response.data.Feature

    // CSVデータ生成
    let csvData = 'Name,Address,Lat,Lng,GenreCode,GenreName\n'
    data.forEach((item: any) => {
      const name = item.Name.replace(/,/g, '')
      const address = item.Property.Address.replace(/,/g, '')
      const lat = item.Geometry.Coordinates.split(',')[1]
      const lng = item.Geometry.Coordinates.split(',')[0]

      const genreCode = item.Property.Genre?.Code || ''
      const genreName = item.Property.Genre?.Name || ''

      csvData += `${name},${address},${lat},${lng},${genreCode},${genreName}\n`
    })


    fs.writeFileSync(OUTPUT_FILE, csvData)
    console.log(`データをCSVファイル(${OUTPUT_FILE})に保存しました！`)

  } catch (error) {
    console.error('データ取得に失敗しました:', error)
  }
}

fetchData()
