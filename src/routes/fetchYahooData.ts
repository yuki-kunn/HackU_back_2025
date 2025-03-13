import axios from 'axios'
import * as dotenv from 'dotenv'
import { supabase } from '../utils/supabase.ts'

dotenv.config()

const API_KEY = process.env.YAHOO_API_KEY

const fetchData = async (lat: string, lng: string, radius: string = '1000') => {
  try {
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        lat: lat,
        lon: lng,
        dist: radius,
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
        const genreCode = genre ? genre.Code : 'N/A'
        const genreName = genre ? genre.Name : 'N/A'

        return {
          name: item.Name,
          address: item.Property.Address,
          lat: item.Geometry.Coordinates.split(',')[1],
          lng: item.Geometry.Coordinates.split(',')[0],
          genreCode, 
          genreName  
        }
      })

    // 取得データをDBに保存（重複時は更新）
    const { data: savedData, error } = await supabase
      .from('landmarks')
      .upsert(jsonData.map((item: { name: any; address: any; lat: any; lng: any; genreCode: any; genreName: any }) => ({
        name: item.name,
        address: item.address,
        latitude: item.lat,
        longitude: item.lng,
        genre_code: item.genreCode,
        genre_name: item.genreName
      })), { onConflict: 'latitude,longitude' })

    if (error) {
      console.error('データ保存に失敗しました:', error)
      throw error
    }

    console.log('保存成功:', savedData)

    return jsonData
  } catch (error) {
    console.error('データ取得に失敗しました:', error)
    throw error
  }
}

export default fetchData
