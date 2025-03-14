import * as dotenv from 'dotenv';
import { supabase } from './supabase.ts';

dotenv.config();

const testSupabase = async () => {
  try {
    console.log('Testing simple Supabase connection...');
    
    // テーブルリストを取得する代替方法
    const { data, error } = await supabase
      .from('landmarks')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('Table "landmarks" does not exist yet. This is expected if you have not created it.');
        
        // ランドマークテーブルを作成するSQL
        console.log('Creating landmarks table...');
        
        const { error: createError } = await supabase.rpc('exec', {
          query: `
            CREATE TABLE IF NOT EXISTS public.landmarks (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              name TEXT NOT NULL,
              address TEXT,
              latitude NUMERIC(10,6) NOT NULL,
              longitude NUMERIC(10,6) NOT NULL,
              genre_code TEXT,
              genre_name TEXT,
              tel TEXT,
              detail TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(latitude, longitude)
            );
          `
        });
        
        if (createError) {
          console.error('Error creating table:', createError);
          
          // もう一つの方法でテーブルを作成してみる
          console.log('Trying alternative method to create table...');
          
          // テーブル作成をRAW SQLで試す
          const { error: rawError } = await supabase.rpc('execute', { 
            sql: `
              CREATE TABLE IF NOT EXISTS public.landmarks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT,
                latitude NUMERIC(10,6) NOT NULL,
                longitude NUMERIC(10,6) NOT NULL,
                genre_code TEXT,
                genre_name TEXT,
                tel TEXT,
                detail TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(latitude, longitude)
              );
            `
          });
          
          if (rawError) {
            console.error('Alternative method also failed:', rawError);
            console.log('Please create the table manually using the Supabase dashboard.');
          } else {
            console.log('Table creation successful!');
          }
        } else {
          console.log('Table creation successful!');
        }
      } else {
        console.error('Error connecting to Supabase:', error);
      }
    } else {
      console.log('Connection successful!');
      console.log('Sample data:', data);
    }

    // テストデータの挿入
    const testLandmark = {
      name: "テスト場所",
      address: "大阪府大阪市中央区",
      latitude: 34.6873,
      longitude: 135.5262,
      genre_code: "0000",
      genre_name: "テスト"
    };

    console.log('Inserting test data...');
    const { data: insertData, error: insertError } = await supabase
      .from('landmarks')
      .insert([testLandmark])
      .select();

    if (insertError) {
      console.error('Error inserting test data:', insertError);
    } else {
      console.log('Data inserted successfully:', insertData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

testSupabase().catch(console.error).finally(() => console.log('Test completed'));
