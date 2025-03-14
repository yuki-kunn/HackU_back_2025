import axios from 'axios'
import * as dotenv from 'dotenv'
import { supabase } from '../utils/supabase.ts'

dotenv.config()

const API_KEY = process.env.YAHOO_API_KEY

const fetchData = async (lat: string, lng: string, radius: string = '1000') => {
  try {
    console.log(`Yahoo API request: lat=${lat}, lng=${lng}, radius=${radius}, apiKey=${API_KEY ? 'exists' : 'missing'}`)
    
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        lat: lat,
        lon: lng, // ここでlngではなくlonを使用している点に注意
        dist: radius,
        output: 'json',
        sort: 'dist',
        results: 50
      }
    })

    console.log(`Yahoo API response status: ${response.status}`)
    console.log(`Yahoo API total results: ${response.data.ResultInfo?.Total || 0}`)
    
    const data = response.data.Feature
    if (!data || !Array.isArray(data)) {
      console.warn('No features found in Yahoo API response')
      return []
    }

    const jsonData = data.map((item: any) => {
      // 各施設の情報を抽出
      console.log('Processing item:', item.Name)
      // Genreが存在していれば最初の要素
      const genre = item.Property.Genre && item.Property.Genre.length > 0 ? item.Property.Genre[0] : null
      const genreCode = genre ? genre.Code : 'N/A'
      const genreName = genre ? genre.Name : 'N/A'
      // 座標は"経度,緯度"形式なので分割する
      const coordinates = item.Geometry.Coordinates.split(',')
      const lng = coordinates[0]
      const lat = coordinates[1]
      
      return {
        name: item.Name,
        address: item.Property.Address,
        lat: lat,
        lng: lng,
        genreCode, 
        genreName  
      }
    })

    try {
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
      } else {
        console.log('保存成功')
      }
    } catch (dbError) {
      console.error('DB保存中にエラーが発生しました:', dbError)
    }

    return jsonData
  } catch (error) {
    console.error('Yahoo APIデータ取得に失敗しました:', error.response?.data || error.message)
    throw error
  }
}

export default fetchData
