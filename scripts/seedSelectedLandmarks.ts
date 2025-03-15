import * as dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY;

// 上限件数と最小距離（メートル）
const MAX_LANDMARKS = 500;
const MIN_DISTANCE = 20; // 50m以上離れていること

// 大阪府全体の中心座標と半径（例: 大阪市の中心から20km）
const osakaCenter = { lat: 34.6937, lng: 135.5023 };
const osakaRadius = 20000; // 20km

// 取得地域を限定
const osakaLocations = [
  // 指定された8区のみに制限
  { name: '住吉大社', lat: 34.6157, lng: 135.4914, city: '大阪市住吉区' },
  { name: '新今宮', lat: 34.6478, lng: 135.5006, city: '大阪市西成区' },
  { name: '大正区役所', lat: 34.6611, lng: 135.4724, city: '大阪市大正区' },
  { name: 'ATCホール', lat: 34.6428, lng: 135.4119, city: '大阪市住之江区' },
  { name: '平野区役所', lat: 34.6097, lng: 135.5458, city: '大阪市平野区' },
  { name: '東住吉区役所', lat: 34.6216, lng: 135.5283, city: '大阪市東住吉区' },
  { name: '生野コリアタウン', lat: 34.6553, lng: 135.5340, city: '大阪市生野区' },
  { name: '旭区役所', lat: 34.7224, lng: 135.5441, city: '大阪市旭区' }
];

// ジャンルコードの優先順位マッピング（数値が小さいほど優先度が高い）
const genrePriority = {
  // 観光地・イベント（最優先）
  '0301': 1, // 観光・文化施設
  '0302': 1, // レジャー・スポーツ施設
  '0401': 1, // イベント
  '0406': 1, // 大学・短大・専門学校
  '0303': 1, // 遊園地
  
  // 有名な飲食店・ショップ（次に優先）
  '0101': 2, // グルメ
  '0102': 2, // ショッピング
  
  // その他（優先度低）
  '0103': 3, // 生活施設
  '0201': 3, // 交通施設
  '0202': 3  // 宿泊施設
};

/**
 * Yahoo!ローカルサーチAPIからデータを取得する関数
 */
const fetchFromYahooAPI = async (lat: number, lng: number, radius: number = 2000) => {
  try {
    console.log(`Fetching data for lat=${lat}, lng=${lng}...`);
    
    // まず観光地とイベント情報を検索（優先的に取得）
    const tourismParams = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      gc: '0301,0302,0304,0401,0403,0303', // 観光・イベント関連のジャンルコードに遊園地を追加
      output: 'json',
      sort: 'score', // 評価順
      results: 100 // 取得数を増やして多様性を確保
    };

    // 教育施設の検索パラメータを追加
    const educationParams = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      gc: '0404,0405,0406', // 教育施設のジャンルコード
      output: 'json',
      sort: 'score',
      results: 50
    };

    // 並列にリクエストを実行
    const [educationResponse, tourismResponse] = await Promise.all([
      axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: educationParams }),
      axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: tourismParams })
    ]);
    
    // 次に飲食店・ショップ情報を検索
    const shopParams = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      gc: '0101,0102', // 飲食店・ショップのジャンルコード
      output: 'json',
      sort: 'score', // 評価順
      results: 50
    };
    
    const shopResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: shopParams });
    
    // その他の情報も検索
    const otherParams = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      output: 'json',
      sort: 'score',
      results: 60
    };
    
    const otherResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: otherParams });
    
    // 4つの結果を結合
    const tourismFeatures = tourismResponse.data.Feature || [];
    const shopFeatures = shopResponse.data.Feature || [];
    const otherFeatures = otherResponse.data.Feature || [];
    const educationFeatures = educationResponse.data.Feature || [];
    const allFeatures = [...tourismFeatures, ...shopFeatures, ...otherFeatures, ...educationFeatures];
    
    console.log(`Fetched total ${allFeatures.length} landmarks`);
    
    return allFeatures.map((item: any) => {
      // 経度,緯度の形式になっているので分割
      const [longitude, latitude] = item.Geometry.Coordinates.split(',').map(Number);
      
      // ジャンル情報の取得
      const genre = item.Property.Genre && item.Property.Genre.length > 0 ? item.Property.Genre[0] : null;
      const genreCode = genre ? genre.Code : null;
      const genreName = genre ? genre.Name : null;
      
      // 住所から市区町村を抽出
      let city = '不明';
      if (item.Property.Address) {
        const match = item.Property.Address.match(/大阪[府市](\S+?[市区町村])/);
        city = match ? match[1] : '大阪市';
      }
      
      // ランドマークの優先度を決定
      let priority = 5; // デフォルトは最低優先度
      if (genreCode && genrePriority[genreCode]) {
        priority = genrePriority[genreCode];
      }
      
      return {
        name: item.Name,
        address: item.Property.Address || null,
        latitude,
        longitude,
        genre_code: genreCode,
        genre_name: genreName,
        tel: item.Property.Tel || null,
        detail: item.Property.Detail || null,
        city, // 市区町村情報を追加
        priority // 優先度を追加
      };
    });
  } catch (error) {
    console.error('Error fetching from Yahoo API:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Haversine 公式による2点間の距離（メートル）を計算
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lat2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * ランドマーク配列から、最低距離以上離れているものをフィルタする関数
 */
function filterByMinimumDistance(landmarks: any[], minDistance: number): any[] {
  const filtered: any[] = [];
  for (const landmark of landmarks) {
    // 既に選ばれているものとの距離をチェック
    const tooClose = filtered.some(selected => {
      const d = haversineDistance(landmark.latitude, landmark.longitude, selected.latitude, selected.longitude);
      return d < minDistance;
    });
    if (!tooClose) {
      filtered.push(landmark);
    }
  }
  return filtered;
}

/**
 * 市区町村ごとにデータを制限して保存する関数
 * ※重複除去後、さらに LANDMARK間がMIN_DISTANCE以上となるようにフィルタ
 */
const saveSelectedLandmarks = async (landmarks: any[]) => {
  if (landmarks.length === 0) {
    return 0;
  }

  try {
    // 重複を除去（緯度経度で判定） ※小数点以下6桁として一意化
    const uniqueLandmarks = Object.values(
      landmarks.reduce((acc: Record<string, any>, landmark) => {
        const key = `${landmark.latitude.toFixed(6)},${landmark.longitude.toFixed(6)}`;
        // 既存のデータより優先度が高い場合のみ上書き
        if (!acc[key] || landmark.priority < acc[key].priority) {
          acc[key] = landmark;
        }
        return acc;
      }, {})
    );
    
    console.log(`Found ${landmarks.length} landmarks, ${uniqueLandmarks.length} unique landmarks`);
    
    // 市区町村ごとのグループ化処理は従来通り
    const cityGroups: Record<string, any[]> = {};
    uniqueLandmarks.forEach(landmark => {
      if (!cityGroups[landmark.city]) {
        cityGroups[landmark.city] = [];
      }
      cityGroups[landmark.city].push(landmark);
    });
    
    // 各市区町村で優先度が高い順にソートし、上位10件を選択
    let selectedLandmarks: any[] = [];
    Object.entries(cityGroups).forEach(([city, landmarks]) => {
      const sorted = landmarks.sort((a, b) => a.priority - b.priority);
      const top = sorted.slice(0, 10);
      selectedLandmarks.push(...top);
      console.log(`Selected ${top.length} landmarks from ${city} (${landmarks.length} available)`);
    });
    
    // ランドマーク同士がMIN_DISTANCE以上離れているかフィルタ
    selectedLandmarks = filterByMinimumDistance(selectedLandmarks, MIN_DISTANCE);
    
    // 上限件数に収める
    if (selectedLandmarks.length > MAX_LANDMARKS) {
      selectedLandmarks = selectedLandmarks.slice(0, MAX_LANDMARKS);
    }
    
    // DB保存用に整形（内部フィールドを削除）
    const landmarksForDB = selectedLandmarks.map(({ city, priority, ...rest }) => rest);
    
    const { data, error } = await supabase
      .from('landmarks')
      .upsert(landmarksForDB, {
        onConflict: 'latitude,longitude',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error saving landmarks to DB:', error);
      return 0;
    }
    
    console.log(`Successfully saved ${landmarksForDB.length} landmarks to database`);
    return landmarksForDB.length;
  } catch (error) {
    console.error('Error in saveSelectedLandmarks:', error);
    throw error;
  }
};

/**
 * メイン実行関数
 */
const seedSelectedLandmarks = async () => {
  console.log('Starting selected landmarks seed process...');
  
  // 大阪府全体のランドマークを取得
  const landmarks = await fetchFromYahooAPI(osakaCenter.lat, osakaCenter.lng, osakaRadius);
  
  if (landmarks.length > 0) {
    const savedCount = await saveSelectedLandmarks(landmarks);
    console.log(`Saved ${savedCount} landmarks`);
  } else {
    console.log('No landmarks found');
  }
  
  console.log('Seed process completed');
};

// スクリプトの実行
seedSelectedLandmarks()
  .catch(error => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished');
  });