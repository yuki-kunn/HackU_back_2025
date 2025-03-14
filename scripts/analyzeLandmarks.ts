import * as dotenv from 'dotenv';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const analyzeDatabase = async () => {
  console.log('Analyzing landmarks in database...');
  
  // 総件数を取得
  const { data: countData, error: countError } = await supabase
    .from('landmarks')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error counting landmarks:', countError);
  } else {
    console.log(`Total landmarks in database: ${countData?.count || 0}`);
  }
  
  // ジャンルごとの数を集計
  const { data, error } = await supabase
    .from('landmarks')
    .select('genre_code, genre_name');
  
  if (error) {
    console.error('Error fetching landmarks:', error);
    return;
  }
  
  // ジャンル集計
  const genreCounts: Record<string, { count: number, name: string }> = {};
  
  data.forEach(landmark => {
    const genreCode = landmark.genre_code || 'unknown';
    
    if (!genreCounts[genreCode]) {
      genreCounts[genreCode] = {
        count: 0,
        name: landmark.genre_name || 'Unknown'
      };
    }
    
    genreCounts[genreCode].count++;
  });
  
  // 結果表示
  console.log('\nGenre breakdown:');
  Object.entries(genreCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([code, { count, name }]) => {
      console.log(`${code} (${name}): ${count} landmarks`);
    });
  
  // 地域別の集計（住所から都市を抽出）
  const cities: Record<string, number> = {};
  
  data.forEach(landmark => {
    if (!landmark.address) return;
    
    // 住所から都市を抽出（例: "大阪府大阪市〇〇区..."→"大阪市"）
    const match = landmark.address.match(/大阪府(\S+?市|\S+?町|\S+?村)/);
    const city = match ? match[1] : '不明';
    
    cities[city] = (cities[city] || 0) + 1;
  });
  
  // 結果表示
  console.log('\nCity breakdown:');
  Object.entries(cities)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`${city}: ${count} landmarks`);
    });
};

// 実行
analyzeDatabase()
  .catch(console.error)
  .finally(() => console.log('\nAnalysis completed'));
