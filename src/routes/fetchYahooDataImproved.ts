import axios from 'axios'
import * as dotenv from 'dotenv'
import { supabase } from '../utils/supabase.ts'

dotenv.config()

const API_KEY = process.env.YAHOO_API_KEY

// APIでどのようなデータを優先的に取得するかの設定
const fetchData = async (lat: string, lng: string, radius: string = '1000') => {
  try {
    console.log(`Yahoo API request: lat=${lat}, lng=${lng}, radius=${radius}`)
    
    // 優先取得したいジャンルコード（観光地、イベント情報など）
    const priorityGenres = '0301,0302,0304,0401,0403';
    
    // 観光地・イベントの検索
    const tourismResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        lat: lat,
        lon: lng,
        dist: radius,
        gc: priorityGenres,
        output: 'json',
        sort: 'score', // 評価順でソート
        results: 30
      }
    })
    
    // 飲食店などの検索
    const shopResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        lat: lat,
        lon: lng,
        dist: radius,
        gc: '0101,0102',
        output: 'json',
        sort: 'score', // 評価順でソート
        results: 20
      }
    })
    
    // データの取得
    const tourismFeatures = tourismResponse.data.Feature || [];
    const shopFeatures = shopResponse.data.Feature || [];
    
    const allFeatures = [...tourismFeatures, ...shopFeatures];
    
    if (!allFeatures.length) {
      console.warn('No features found in Yahoo API response')
      return []
    }

    console.log(`Found total ${allFeatures.length} features`)
    
    // 市区町村ごとのデータを格納するオブジェクト
    const cityData: {[key: string]: any[]} = {};
    
    // 取得データを市区町村ごとに分類
    allFeatures.forEach(item => {
      // 市区町村を抽出
      let city = '不明';
      if (item.Property.Address) {
        const match = item.Property.Address.match(/大阪[府市](\S+?[市区町村])/);
        city = match ? match[1] : '大阪市';
      }
      
      if (!cityData[city]) {
        cityData[city] = [];
      }
      
      // データがすでに10件ある場合はスキップ
      if (cityData[city].length >= 10) return;
      
      // ジャンルを取得
      const genre = item.Property.Genre && item.Property.Genre.length > 0 ? item.Property.Genre[0] : null;
      const genreCode = genre ? genre.Code : 'N/A';
      const genreName = genre ? genre.Name : 'N/A';
      
      // 座標を取得
      const coordinates = item.Geometry.Coordinates.split(',');
      const lng = coordinates[0];
      const lat = coordinates[1];
      
      cityData[city].push({
        name: item.Name,
        address: item.Property.Address,
        lat: lat,
        lng: lng,
        genreCode,
        genreName,
        tel: item.Property.Tel || null,
        detail: item.Property.Detail || null
      });
    });
    
    // 市区町村ごとのデータを結合して返す
    const jsonData = Object.values(cityData).flat();
    
    console.log(`Returning ${jsonData.length} landmarks filtered by city (max 10 per city)`);

    // DBに保存処理
    try {
      // 取得データをDBに保存（重複時は更新）
      const { data: savedData, error } = await supabase
        .from('landmarks')
        .upsert(jsonData.map((item: any) => ({
          name: item.name,
          address: item.address,
          latitude: item.lat,
          longitude: item.lng,
          genre_code: item.genreCode,
          genre_name: item.genreName,
          tel: item.tel,
          detail: item.detail
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
