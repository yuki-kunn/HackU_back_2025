import * as dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY;

// 大阪府内の主要エリア
const osakaLocations = [
  { name: '大阪駅', lat: 34.7024, lng: 135.4959 },
  { name: '難波', lat: 34.6659, lng: 135.5018 },
  { name: '心斎橋', lat: 34.6732, lng: 135.5008 },
  { name: '天王寺', lat: 34.6472, lng: 135.5111 },
  { name: '梅田', lat: 34.7052, lng: 135.4957 },
  { name: 'USJ', lat: 34.6654, lng: 135.4323 },
  { name: '大阪城', lat: 34.6873, lng: 135.5262 },
  { name: '新大阪', lat: 34.7331, lng: 135.5002 },
  { name: '京橋', lat: 34.6963, lng: 135.5343 },
  { name: '本町', lat: 34.6881, lng: 135.5015 },
  { name: '堺', lat: 34.5733, lng: 135.4831 },
  { name: '淀屋橋', lat: 34.6922, lng: 135.5021 },
];

// 取得したい業種コード
// 業種コードの説明：
// 01xx: 店舗・施設（飲食店、物販、サービス等）
// 02xx: 交通・宿泊施設
// 03xx: 観光・文化・スポーツ施設
// 04xx: イベント・レジャー
const targetGenreCodes = [
  '01', // 店舗・施設全般
  '0101', // グルメ
  '0102', // ショッピング
  '0103', // 生活施設
  '0301', // 観光・文化施設
  '0302', // レジャー・スポーツ施設
  '0304', // 史跡・名所
  '04', // イベント・レジャー全般
  '0401', // イベント
  '0403', // 体験・ツアー
];

// Yahoo APIからデータを取得する関数
const fetchLandmarksFromYahoo = async (lat: number, lng: number, radius: number = 1000, gc: string | null = null) => {
  try {
    console.log(`Fetching landmarks for ${lat}, ${lng} with genre code ${gc || 'all'}...`);
    
    const params: any = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      output: 'json',
      sort: 'dist',
      results: 100 // 1回のリクエストで最大100件
    };
    
    // 業種コードが指定されている場合は追加
    if (gc) {
      params.gc = gc;
    }
    
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params });

    if (!response.data.Feature || !Array.isArray(response.data.Feature)) {
      console.warn('No landmarks found');
      return [];
    }

    console.log(`Found ${response.data.Feature.length} landmarks for genre ${gc || 'all'}`);
    
    return response.data.Feature.map((item: any) => {
      // 経度,緯度の形式になっているので分割
      const [longitude, latitude] = item.Geometry.Coordinates.split(',').map(Number);
      
      // ジャンル情報の取得
      const genre = item.Property.Genre && item.Property.Genre.length > 0 ? item.Property.Genre[0] : null;
      
      return {
        name: item.Name,
        address: item.Property.Address || null,
        latitude,
        longitude,
        genre_code: genre ? genre.Code : null,
        genre_name: genre ? genre.Name : null,
        tel: item.Property.Tel || null,
        detail: item.Property.Detail || null
      };
    });
  } catch (error) {
    console.error('Error fetching landmarks:', error.response?.data || error.message);
    return [];
  }
};

// データをSupabaseに保存する関数
const saveLandmarksToSupabase = async (landmarks: any[]) => {
  if (landmarks.length === 0) {
    return 0;
  }

  try {
    // 重複を防ぐため、緯度経度のペアをキーにして一意のランドマークを作成
    const uniqueKey = (landmark: any) => `${landmark.latitude.toFixed(6)},${landmark.longitude.toFixed(6)}`;
    const uniqueLandmarks = Object.values(
      landmarks.reduce((acc: Record<string, any>, landmark) => {
        const key = uniqueKey(landmark);
        acc[key] = landmark;
        return acc;
      }, {})
    );
    
    console.log(`Processing ${uniqueLandmarks.length} unique landmarks...`);
    
    let successCount = 0;
    
    // 一件ずつ挿入して確実に保存
    for (const landmark of uniqueLandmarks) {
      const { error } = await supabase
        .from('landmarks')
        .upsert([landmark], {
          onConflict: 'latitude,longitude',
          ignoreDuplicates: true
        });
      
      if (!error) {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`Progress: ${successCount}/${uniqueLandmarks.length} landmarks saved`);
        }
      }
      
      // APIの制限対策として各リクエスト間に小さな遅延を追加
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    console.log(`Successfully saved ${successCount} landmarks to Supabase`);
    return successCount;
  } catch (error) {
    console.error('Error saving landmarks to Supabase:', error);
    throw error;
  }
};

// メイン実行関数
const seedOsakaLandmarks = async () => {
  console.log('Starting Osaka landmarks seed process...');
  
  let totalFetched = 0;
  let totalSaved = 0;
  const maxLandmarks = 500; // 最大500件まで
  
  // 各エリアをループ
  for (const location of osakaLocations) {
    console.log(`\nProcessing area: ${location.name}`);
    
    // 合計が500件を超えたら終了
    if (totalFetched >= maxLandmarks) {
      console.log(`Reached maximum limit of ${maxLandmarks} landmarks. Stopping fetch.`);
      break;
    }
    
    // 各業種コードでデータを取得
    for (const genreCode of targetGenreCodes) {
      // 合計が500件を超えたら終了
      if (totalFetched >= maxLandmarks) {
        break;
      }
      
      // Yahoo APIからデータ取得
      const landmarks = await fetchLandmarksFromYahoo(location.lat, location.lng, 1000, genreCode);
      
      // 500件の制限に収まるように調整
      const remainingCount = maxLandmarks - totalFetched;
      const landmarksToProcess = landmarks.slice(0, remainingCount);
      totalFetched += landmarksToProcess.length;
      
      if (landmarksToProcess.length > 0) {
        // Supabaseに保存
        const saved = await saveLandmarksToSupabase(landmarksToProcess);
        totalSaved += saved;
      }
      
      // APIの制限に配慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\nSeed completed! Total landmarks fetched: ${totalFetched}, saved: ${totalSaved}`);
};

// スクリプトの実行
seedOsakaLandmarks()
  .catch(error => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished');
  });
