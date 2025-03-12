import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const API_KEY = process.env.YAHOO_API_KEY
const AREA_CODE = '27'

const fetchData = async () => {
  try {
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        ac: AREA_CODE,
        output: 'json',
        sort: 'dist',
        results: 50
      }
    })

    const data = response.data.Feature
    const jsonData = data.map((item: any) => {
        console.log('Property.Genre:', item.Property.Genre) 

        // Genreが空でない場合に最初の要素を取得
        const genre = item.Property.Genre && item.Property.Genre.length > 0 ? item.Property.Genre[0] : null
        const genreCode = genre ? genre.Code : 'N/A' // 存在しない場合のデフォルト値
        const genreName = genre ? genre.Name : 'N/A' // 存在しない場合のデフォルト値

        return {
          name: item.Name,
          address: item.Property.Address,
          lat: item.Geometry.Coordinates.split(',')[1],
          lng: item.Geometry.Coordinates.split(',')[0],
          genreCode, 
          genreName  
        }
      })

    return jsonData
  } catch (error) {
    console.error('データ取得に失敗しました:', error)
    throw error
  }
}

export default fetchData
