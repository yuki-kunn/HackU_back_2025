import * as dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY;

// シードする地域のリスト（大阪の主要エリア）
const seedLocations = [
  { name: '大阪駅', lat: 34.7024, lng: 135.4959 },
  { name: '難波', lat: 34.6659, lng: 135.5018 },
  { name: '心斎橋', lat: 34.6732, lng: 135.5008 },
  { name: '天王寺', lat: 34.6472, lng: 135.5111 },
  { name: '梅田', lat: 34.7052, lng: 135.4957 }
  // 必要に応じて追加または削減
];

/**
 * Yahoo!ローカルサーチAPIから指定した位置の周辺ランドマークを取得
 */
const fetchLandmarksFromYahoo = async (lat: number, lng: number, radius: number = 1000) => {
  try {
    console.log(`Fetching landmarks for ${lat}, ${lng}...`);
    
    const response = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', {
      params: {
        appid: API_KEY,
        lat: lat.toString(),
        lon: lng.toString(),
        dist: radius.toString(),
        output: 'json',
        sort: 'dist',
        results: 100  // 最大100件取得
      }
    });

    if (!response.data.Feature || !Array.isArray(response.data.Feature)) {
      console.warn('No landmarks found');
      return [];
    }

    console.log(`Found ${response.data.Feature.length} landmarks`);
    
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
        detail: item.Property.Detail || null,
        created_at: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('Error fetching landmarks:', error.response?.data || error.message);
    return [];
  }
};

/**
 * 取得したランドマークをSupabaseに保存
 */
const saveLandmarksToSupabase = async (landmarks: any[]) => {
  if (landmarks.length === 0) {
    return 0;
  }

  try {
    // 重複を防ぐため、緯度経度のペアをキーにして一意のランドマークを作成
    const uniqueLandmarks = Object.values(
      landmarks.reduce((acc: Record<string, any>, landmark) => {
        // 緯度経度を小数点以下6桁に丸めてキーを作成
        const key = `${landmark.latitude.toFixed(6)},${landmark.longitude.toFixed(6)}`;
        acc[key] = landmark;
        return acc;
      }, {})
    );
    
    console.log(`Found ${landmarks.length} landmarks, ${uniqueLandmarks.length} unique landmarks`);
    
    // 一度に挿入するデータ数を制限
    const batchSize = 20; // 少なくして処理
    let successCount = 0;
    
    for (let i = 0; i < uniqueLandmarks.length; i += batchSize) {
      const batch = uniqueLandmarks.slice(i, i + batchSize);
      
      // 一件ずつ挿入してエラーをスキップ
      for (const landmark of batch) {
        const { data, error } = await supabase
          .from('landmarks')
          .upsert([landmark], {
            onConflict: 'latitude,longitude',
            ignoreDuplicates: true // 重複は無視する設定に変更
          });
        
        if (error) {
          if (error.code === '23505') {
            // 一意性制約違反は無視して続行
            console.log(`Skipping duplicate: ${landmark.name} at ${landmark.latitude},${landmark.longitude}`);
          } else {
            console.error(`Error inserting landmark ${landmark.name}:`, error);
          }
        } else {
          successCount++;
        }
        
        // APIの制限対策として各リクエスト間に小さな遅延を追加
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueLandmarks.length/batchSize)}, saved so far: ${successCount}`);
    }
    
    return successCount;
  } catch (error) {
    console.error('Error saving landmarks to Supabase:', error);
    throw error;
  }
};

/**
 * メイン実行関数
 */
const seedDatabase = async () => {
  console.log('Starting database seed process...');
  
  let totalSaved = 0;
  
  for (const location of seedLocations) {
    console.log(`\nProcessing area: ${location.name}`);
    
    // Yahoo APIからデータ取得
    const landmarks = await fetchLandmarksFromYahoo(location.lat, location.lng);
    
    if (landmarks.length > 0) {
      // Supabaseに保存
      const saved = await saveLandmarksToSupabase(landmarks);
      console.log(`Saved ${saved} landmarks for ${location.name}`);
      totalSaved += saved || 0;
    }
    
    // APIの制限に配慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\nSeed completed! Total landmarks saved: ${totalSaved}`);
};

// スクリプトの実行
seedDatabase()
  .catch(error => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished');
  });
