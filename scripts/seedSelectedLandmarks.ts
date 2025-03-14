import * as dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY;

// 大阪府全体の主要エリア（市区町村ごとに分散）
const osakaLocations = [
  // 大阪市内
  { name: '大阪駅', lat: 34.7024, lng: 135.4959, city: '大阪市北区' },
  { name: '難波', lat: 34.6659, lng: 135.5018, city: '大阪市中央区' },
  { name: '天王寺', lat: 34.6472, lng: 135.5111, city: '大阪市天王寺区' },
  { name: 'USJ', lat: 34.6654, lng: 135.4323, city: '大阪市此花区' },
  { name: '大阪城', lat: 34.6873, lng: 135.5262, city: '大阪市中央区' },
  { name: '新大阪', lat: 34.7331, lng: 135.5002, city: '大阪市淀川区' },
  { name: '京橋', lat: 34.6963, lng: 135.5343, city: '大阪市都島区' },
  { name: '鶴橋', lat: 34.6656, lng: 135.5341, city: '大阪市生野区' },
  { name: '阿倍野', lat: 34.6434, lng: 135.5134, city: '大阪市阿倍野区' },
  { name: '弁天町', lat: 34.6632, lng: 135.4617, city: '大阪市港区' },
  { name: '鶴見緑地', lat: 34.7079, lng: 135.5769, city: '大阪市鶴見区' },
  
  // 大阪府北部
  { name: '豊中市役所', lat: 34.7823, lng: 135.4705, city: '豊中市' },
  { name: '千里中央', lat: 34.8080, lng: 135.4954, city: '豊中市' },
  { name: '吹田市役所', lat: 34.7592, lng: 135.5169, city: '吹田市' },
  { name: '万博記念公園', lat: 34.8061, lng: 135.5300, city: '吹田市' },
  { name: '高槻市役所', lat: 34.8461, lng: 135.6171, city: '高槻市' },
  { name: '茨木市役所', lat: 34.8166, lng: 135.5687, city: '茨木市' },
  { name: '箕面市役所', lat: 34.8235, lng: 135.4694, city: '箕面市' },
  { name: '箕面の滝', lat: 34.8531, lng: 135.4713, city: '箕面市' },
  { name: '池田市役所', lat: 34.8222, lng: 135.4281, city: '池田市' },
  
  // 大阪府東部
  { name: '枚方市役所', lat: 34.8146, lng: 135.6508, city: '枚方市' },
  { name: '寝屋川市役所', lat: 34.7669, lng: 135.6281, city: '寝屋川市' },
  { name: '交野市役所', lat: 34.7878, lng: 135.6800, city: '交野市' },
  { name: '四條畷市役所', lat: 34.7406, lng: 135.6394, city: '四條畷市' },
  { name: '大東市役所', lat: 34.7117, lng: 135.6225, city: '大東市' },
  { name: '東大阪市役所', lat: 34.6792, lng: 135.6008, city: '東大阪市' },
  { name: '八尾市役所', lat: 34.6285, lng: 135.6011, city: '八尾市' },
  { name: '柏原市役所', lat: 34.5790, lng: 135.6285, city: '柏原市' },
  
  // 大阪府南部
  { name: '堺市役所', lat: 34.5733, lng: 135.4831, city: '堺市堺区' },
  { name: '大仙公園', lat: 34.5656, lng: 135.4881, city: '堺市堺区' },
  { name: '堺東駅', lat: 34.5736, lng: 135.4712, city: '堺市堺区' },
  { name: '泉佐野市役所', lat: 34.4664, lng: 135.3273, city: '泉佐野市' },
  { name: '関西国際空港', lat: 34.4320, lng: 135.2304, city: '泉佐野市' },
  { name: '岸和田市役所', lat: 34.4603, lng: 135.3714, city: '岸和田市' },
  { name: '岸和田だんじり会館', lat: 34.4589, lng: 135.3709, city: '岸和田市' },
  { name: '和泉市役所', lat: 34.4839, lng: 135.4279, city: '和泉市' },
  { name: '泉大津市役所', lat: 34.5006, lng: 135.4068, city: '泉大津市' },
  { name: '高石市役所', lat: 34.5211, lng: 135.4417, city: '高石市' },
  { name: '泉南市役所', lat: 34.3662, lng: 135.2738, city: '泉南市' },
  { name: '阪南市役所', lat: 34.3583, lng: 135.2396, city: '阪南市' },
  { name: '熊取町役場', lat: 34.4019, lng: 135.3570, city: '熊取町' },
  { name: '田尻町役場', lat: 34.4386, lng: 135.2899, city: '田尻町' },
  { name: '岬町役場', lat: 34.3178, lng: 135.1420, city: '岬町' },
  
  // 大阪府中部
  { name: '松原市役所', lat: 34.5784, lng: 135.5520, city: '松原市' },
  { name: '藤井寺市役所', lat: 34.5733, lng: 135.5973, city: '藤井寺市' },
  { name: '羽曳野市役所', lat: 34.5578, lng: 135.6060, city: '羽曳野市' },
  { name: '富田林市役所', lat: 34.4992, lng: 135.5969, city: '富田林市' },
  { name: '大阪狭山市役所', lat: 34.5006, lng: 135.5566, city: '大阪狭山市' },
  { name: '河内長野市役所', lat: 34.4580, lng: 135.5641, city: '河内長野市' },
  { name: '河内長野駅', lat: 34.4584, lng: 135.5681, city: '河内長野市' },
  { name: '河内長野・観心寺', lat: 34.4195, lng: 135.5954, city: '河内長野市' },
  { name: '太子町役場', lat: 34.5185, lng: 135.6479, city: '太子町' },
  { name: '千早赤阪村役場', lat: 34.4810, lng: 135.6310, city: '千早赤阪村' },
  { name: '金剛山', lat: 34.4173, lng: 135.6710, city: '千早赤阪村' },
  
  // 観光スポット追加
  { name: '海遊館', lat: 34.6540, lng: 135.4291, city: '大阪市港区' },
  { name: '通天閣', lat: 34.6524, lng: 135.5059, city: '大阪市浪速区' },
  { name: 'なんばグランド花月', lat: 34.6668, lng: 135.5012, city: '大阪市中央区' },
  { name: 'あべのハルカス', lat: 34.6460, lng: 135.5129, city: '大阪市阿倍野区' },
  { name: '空堀商店街', lat: 34.6724, lng: 135.5212, city: '大阪市中央区' },
  { name: '天神橋筋商店街', lat: 34.7076, lng: 135.5100, city: '大阪市北区' },
  { name: '服部緑地公園', lat: 34.7783, lng: 135.4868, city: '豊中市' },
  { name: 'ひらかたパーク', lat: 34.8114, lng: 135.6491, city: '枚方市' }
];

// ジャンルコードの優先順位マッピング（数値が小さいほど優先度が高い）
const genrePriority = {
  // 観光地・イベント（最優先）
  '0301': 1, // 観光・文化施設
  '0302': 1, // レジャー・スポーツ施設
  '0304': 1, // 史跡・名所
  '0401': 1, // イベント
  '0403': 1, // 体験・ツアー
  
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
const fetchFromYahooAPI = async (lat: number, lng: number, radius: number = 2000) => { // 検索範囲を拡大
  try {
    console.log(`Fetching data for lat=${lat}, lng=${lng}...`);
    
    // まず観光地とイベント情報を検索（優先的に取得）
    const tourismParams = {
      appid: API_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      dist: radius.toString(),
      gc: '0301,0302,0304,0401,0403', // 観光・イベント関連のジャンルコード
      output: 'json',
      sort: 'score', // 評価順
      results: 100 // 取得数を増やして多様性を確保
    };
    
    const tourismResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: tourismParams });
    
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
      results: 20
    };
    
    const otherResponse = await axios.get('https://map.yahooapis.jp/search/local/V1/localSearch', { params: otherParams });
    
    // 3つの結果を結合
    const tourismFeatures = tourismResponse.data.Feature || [];
    const shopFeatures = shopResponse.data.Feature || [];
    const otherFeatures = otherResponse.data.Feature || [];
    
    const allFeatures = [...tourismFeatures, ...shopFeatures, ...otherFeatures];
    
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
 * 市区町村ごとにデータを制限して保存する関数
 */
const saveSelectedLandmarks = async (landmarks: any[]) => {
  if (landmarks.length === 0) {
    return 0;
  }

  try {
    // 重複を除去（緯度経度で判定）
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
    
    // 市区町村ごとにグループ化
    const cityGroups: Record<string, any[]> = {};
    
    uniqueLandmarks.forEach(landmark => {
      if (!cityGroups[landmark.city]) {
        cityGroups[landmark.city] = [];
      }
      cityGroups[landmark.city].push(landmark);
    });
    
    // 各市区町村で優先度が高いものから最大10件を選択
    const selectedLandmarks: any[] = [];
    
    Object.entries(cityGroups).forEach(([city, landmarks]) => {
      // 優先度でソート（優先度が低い数値ほど優先）
      const sortedLandmarks = landmarks.sort((a, b) => a.priority - b.priority);
      // 上位10件を選択
      const topLandmarks = sortedLandmarks.slice(0, 10);
      selectedLandmarks.push(...topLandmarks);
      
      console.log(`Selected ${topLandmarks.length} landmarks from ${city} (${landmarks.length} available)`);
    });
    
    // DB保存用に整形（内部フィールドを削除）
    const landmarksForDB = selectedLandmarks.map(landmark => {
      const { city, priority, ...dbLandmark } = landmark;
      return dbLandmark;
    });
    
    // Supabaseに保存
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
  
  let totalSaved = 0;
  
  // 各エリアのデータを取得（数が多いので小分けに処理）
  const locationBatches = [];
  const batchSize = 10; // バッチサイズを設定
  
  for (let i = 0; i < osakaLocations.length; i += batchSize) {
    locationBatches.push(osakaLocations.slice(i, i + batchSize));
  }
  
  console.log(`Divided ${osakaLocations.length} locations into ${locationBatches.length} batches`);
  
  for (let batchIndex = 0; batchIndex < locationBatches.length; batchIndex++) {
    const locationBatch = locationBatches[batchIndex];
    console.log(`\nProcessing batch ${batchIndex + 1}/${locationBatches.length}`);
    
    const batchLandmarks = [];
    
    for (const location of locationBatch) {
      console.log(`Processing area: ${location.name} (${location.city})`);
      
      // Yahoo APIからデータ取得
      const landmarks = await fetchFromYahooAPI(location.lat, location.lng, 2000);
      
      if (landmarks.length > 0) {
        batchLandmarks.push(...landmarks);
      }
      
      // APIのリクエスト制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // バッチごとに保存処理を行う
    if (batchLandmarks.length > 0) {
      const savedCount = await saveSelectedLandmarks(batchLandmarks);
      totalSaved += savedCount;
      console.log(`Batch ${batchIndex + 1} complete: saved ${savedCount} landmarks`);
      
      // バッチ間で少し長めに待機
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`\nSeed completed! Total landmarks saved: ${totalSaved}`);
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
