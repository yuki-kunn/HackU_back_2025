import * as dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY;

// シードする地域を1つに限定
const location = { name: '大阪駅', lat: 34.7024, lng: 135.4959 };

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
        results: 10  // データ量を減らす
      }
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');

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
        detail: item.Property.Detail || null
      };
    });
  } catch (error) {
    console.error('Error fetching landmarks:', error.response?.data || error.message);
    return [];
  }
};

const seedDatabase = async () => {
  console.log('Starting simple seed process...');
  
  try {
    // Yahoo APIからデータ取得
    const landmarks = await fetchLandmarksFromYahoo(location.lat, location.lng);
    
    if (landmarks.length === 0) {
      console.log('No landmarks found to insert');
      return;
    }
    
    // 一つずつデータを挿入
    for (const landmark of landmarks) {
      console.log(`Inserting landmark: ${landmark.name}`);
      
      const { data, error } = await supabase
        .from('landmarks')
        .insert([landmark])
        .select();
      
      if (error) {
        console.error(`Error inserting ${landmark.name}:`, error);
      } else {
        console.log(`Successfully inserted ${landmark.name}`);
      }
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Seed process completed');
  } catch (error) {
    console.error('Seed failed:', error);
  }
};

// 実行
seedDatabase().catch(console.error);
